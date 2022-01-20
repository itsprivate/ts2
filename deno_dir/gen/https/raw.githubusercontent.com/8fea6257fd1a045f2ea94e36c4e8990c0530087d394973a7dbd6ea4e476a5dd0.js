import { hasPermissionSlient } from "./permission.ts";
import { StepType } from "./internal-interface.ts";
import { parseWorkflow } from "./parse-workflow.ts";
import { getContent } from "./utils/file.ts";
import { getFilesByFilter } from "./utils/filter.ts";
import { isObject } from "./utils/object.ts";
import { parseObject } from "./parse-object.ts";
import { getStepResponse, runStep, setErrorResult } from "./run-step.ts";
import { filterCtxItems, getSourceItemsFromResult, } from "./get-source-items-from-result.ts";
import { delay, dirname, join, log, SqliteDb } from "../../deps.ts";
import report, { getReporter } from "./report.ts";
import { Keydb } from "./adapters/json-store-adapter.ts";
import { filterSourceItems } from "./filter-source-items.ts";
import { markSourceItems } from "./mark-source-items.ts";
import { runCmd, setCmdOkResult } from "./run-cmd.ts";
import { getFinalRunOptions, getFinalSourceOptions, getFinalWorkflowOptions, } from "./default-options.ts";
import { runPost } from "./run-post.ts";
import { runAssert } from './run-assert.ts';
export async function run(runOptions) {
    const debugEnvPermmision = { name: "env", variable: "DEBUG" };
    const dataPermission = { name: "read", path: "data" };
    let DebugEnvValue = undefined;
    if (await hasPermissionSlient(debugEnvPermmision)) {
        DebugEnvValue = Deno.env.get("DEBUG");
    }
    let isDebug = !!(DebugEnvValue !== undefined && DebugEnvValue !== "false");
    const cliWorkflowOptions = getFinalRunOptions(runOptions, isDebug);
    isDebug = cliWorkflowOptions.debug || false;
    const { files, } = cliWorkflowOptions;
    const cwd = Deno.cwd();
    const workflowFiles = await getFilesByFilter(cwd, files);
    let env = {};
    const allEnvPermmision = { name: "env" };
    if (await hasPermissionSlient(allEnvPermmision)) {
        env = Deno.env.toObject();
    }
    let validWorkflows = [];
    const errors = [];
    for (let i = 0; i < workflowFiles.length; i++) {
        const workflowRelativePath = workflowFiles[i];
        const workflowFilePath = join(cwd, workflowRelativePath);
        const fileContent = await getContent(workflowFilePath);
        const workflow = parseWorkflow(fileContent);
        if (!isObject(workflow)) {
            continue;
        }
        validWorkflows.push({
            ctx: {
                public: {
                    env,
                    workflowPath: workflowFilePath,
                    workflowRelativePath: workflowRelativePath,
                    workflowCwd: dirname(workflowFilePath),
                    cwd: cwd,
                    sources: {},
                    steps: {},
                    state: undefined,
                    items: [],
                },
                itemSourceOptions: undefined,
                sourcesOptions: [],
                currentStepType: StepType.Source,
            },
            workflow: workflow,
        });
    }
    validWorkflows = validWorkflows.sort((a, b) => {
        const aPath = a.ctx.public.workflowRelativePath;
        const bPath = b.ctx.public.workflowRelativePath;
        if (aPath < bPath) {
            return -1;
        }
        if (aPath > bPath) {
            return 1;
        }
        return 0;
    });
    report.info(`Found ${validWorkflows.length} valid workflows:\n${validWorkflows.map((item) => item.ctx.public.workflowRelativePath).join("\n")}`);
    for (let workflowIndex = 0; workflowIndex < validWorkflows.length; workflowIndex++) {
        let { ctx, workflow } = validWorkflows[workflowIndex];
        const parsedWorkflowFileOptionsWithEnv = await parseObject(workflow, ctx, {
            keys: ["env"],
        });
        if (parsedWorkflowFileOptionsWithEnv.env) {
            for (const key in parsedWorkflowFileOptionsWithEnv.env) {
                const value = parsedWorkflowFileOptionsWithEnv.env[key];
                if (typeof value === "string") {
                    Deno.env.set(key, value);
                }
            }
        }
        const parsedWorkflowGeneralOptionsWithGeneral = await parseObject(parsedWorkflowFileOptionsWithEnv, ctx, {
            keys: ["if", "debug", "database", "sleep", "limit", "force"],
        });
        const workflowOptions = getFinalWorkflowOptions(cliWorkflowOptions, parsedWorkflowGeneralOptionsWithGeneral ||
            {});
        isDebug = workflowOptions.debug || false;
        const workflowReporter = getReporter(`${ctx.public.workflowRelativePath}`, isDebug);
        if (workflowOptions?.if === false) {
            workflowReporter.info(`Skip this workflow because if condition is false`);
            continue;
        }
        ctx.public.options = workflowOptions;
        const database = workflowOptions.database;
        let db;
        if (database?.startsWith("sqlite")) {
            db = new SqliteDb(database);
        }
        else {
            db = new Keydb(database, {
                namespace: ctx.public.workflowRelativePath,
            });
        }
        ctx.db = db;
        let state;
        let internalState = {
            keys: [],
        };
        if (await hasPermissionSlient(dataPermission)) {
            state = await db.get("state") || undefined;
            internalState = await db.get("internalState") || {
                keys: [],
            };
        }
        ctx.public.state = state;
        ctx.internalState = internalState;
        ctx.initState = JSON.stringify(state);
        ctx.initInternalState = JSON.stringify(internalState);
        const sources = workflow.sources;
        try {
            if (sources) {
                for (let sourceIndex = 0; sourceIndex < sources.length; sourceIndex++) {
                    const source = sources[sourceIndex];
                    ctx.public.sourceIndex = sourceIndex;
                    const sourceReporter = getReporter(`${ctx.public.workflowRelativePath} -> source:${ctx.public.sourceIndex}`, isDebug);
                    let sourceOptions = {
                        ...source,
                    };
                    try {
                        sourceOptions = await parseObject(source, ctx, {
                            keys: ["env"],
                        });
                        sourceOptions = await parseObject(sourceOptions, ctx, {
                            keys: ["if", "debug"],
                        });
                        if (sourceOptions?.debug || ctx.public.options?.debug) {
                            sourceReporter.level = log.LogLevels.DEBUG;
                        }
                        if (sourceOptions.if === false) {
                            sourceReporter.info(`Skip this source because if condition is false`);
                            continue;
                        }
                        sourceOptions = await parseObject(sourceOptions, {
                            ...ctx,
                            public: {
                                ...ctx.public,
                                env: {
                                    ...ctx.public.env,
                                    ...sourceOptions.env,
                                },
                            },
                        });
                        sourceOptions = getFinalSourceOptions(workflowOptions, cliWorkflowOptions, sourceOptions);
                        isDebug = sourceOptions.debug || false;
                        ctx.sourcesOptions.push(sourceOptions);
                        ctx = await runStep(ctx, {
                            reporter: sourceReporter,
                            ...sourceOptions,
                        });
                        ctx = await getSourceItemsFromResult(ctx, {
                            ...sourceOptions,
                            reporter: sourceReporter,
                        });
                        ctx = await filterSourceItems(ctx, sourceReporter);
                        if (sourceOptions.cmd) {
                            const cmdResult = await runCmd(ctx, sourceOptions.cmd);
                            ctx = setCmdOkResult(ctx, cmdResult.stdout);
                        }
                        if (sourceOptions.reverse) {
                            ctx.public.items = ctx.public.items.reverse();
                        }
                        ctx = markSourceItems(ctx);
                        ctx.public.sources[sourceIndex] = getStepResponse(ctx);
                        if (sourceOptions.id) {
                            ctx.public.sources[sourceOptions.id] =
                                ctx.public.sources[sourceIndex];
                        }
                        if (sourceOptions.assert) {
                            ctx = await runAssert(ctx, {
                                reporter: sourceReporter,
                                ...sourceOptions,
                            });
                        }
                        if (sourceOptions.post) {
                            await runPost(ctx, {
                                reporter: sourceReporter,
                                ...sourceOptions,
                            });
                        }
                    }
                    catch (e) {
                        ctx = setErrorResult(ctx, e);
                        ctx.public.sources[sourceIndex] = getStepResponse(ctx);
                        if (source.id) {
                            ctx.public.sources[source.id] = ctx.public.sources[sourceIndex];
                        }
                        if (source.continueOnError) {
                            ctx.public.ok = true;
                            sourceReporter.warning(`Failed to run source`);
                            sourceReporter.warning(e);
                            sourceReporter.warning(`Ignore this error, because continueOnError is true.`);
                            break;
                        }
                        else {
                            sourceReporter.error(`Failed to run source`);
                            throw e;
                        }
                    }
                    if (sourceOptions.sleep && sourceOptions.sleep > 0) {
                        sourceReporter.info(`Sleep ${sourceOptions.sleep} seconds`);
                        await delay(sourceOptions.sleep * 1000);
                    }
                }
            }
            if (sources) {
                let collectCtxItems = [];
                sources.forEach((_, theSourceIndex) => {
                    collectCtxItems = collectCtxItems.concat(ctx.public.sources[theSourceIndex].result);
                });
                ctx.public.items = collectCtxItems;
            }
            if (ctx.public.items.length === 0) {
                workflowReporter.info(`Skip this workflow because no any valid sources items returned`);
                continue;
            }
            const filter = workflow.filter;
            if (filter) {
                ctx.currentStepType = StepType.Filter;
                const filterReporter = getReporter(`${ctx.public.workflowRelativePath} -> filter`, isDebug);
                let filterOptions = { ...filter };
                try {
                    filterOptions = await parseObject(filter, ctx, {
                        keys: ["env"],
                    });
                    filterOptions = await parseObject(filterOptions, ctx, {
                        keys: ["if", "debug"],
                    });
                    if (filterOptions?.debug || ctx.public.options?.debug) {
                        filterReporter.level = log.LogLevels.DEBUG;
                    }
                    if (filterOptions.if === false) {
                        filterReporter.info(`Skip this Filter because if condition is false`);
                        continue;
                    }
                    filterOptions = await parseObject(filterOptions, {
                        ...ctx,
                        public: {
                            ...ctx.public,
                            env: {
                                ...ctx.public.env,
                                ...filterOptions.env,
                            },
                        },
                    });
                    filterOptions = getFinalSourceOptions(workflowOptions, cliWorkflowOptions, filterOptions);
                    isDebug = filterOptions.debug || false;
                    ctx = await runStep(ctx, {
                        reporter: filterReporter,
                        ...filterOptions,
                    });
                    if (Array.isArray(ctx.public.result) &&
                        ctx.public.result.length === ctx.public.items.length) {
                        ctx.public.items = ctx.public.items.filter((_item, index) => {
                            return !!(ctx.public.result[index]);
                        });
                        ctx.public.result = ctx.public.items;
                    }
                    else if (filterOptions.run || filterOptions.use) {
                        filterReporter.error(`Failed to run filter script`);
                        throw new Error("Invalid filter step result, result must be array , boolean[], which array length must be equal to ctx.items length");
                    }
                    if (filterOptions.cmd) {
                        const cmdResult = await runCmd(ctx, filterOptions.cmd);
                        ctx = setCmdOkResult(ctx, cmdResult.stdout);
                    }
                    ctx.public.filter = getStepResponse(ctx);
                    ctx = filterCtxItems(ctx, {
                        ...filterOptions,
                        reporter: filterReporter,
                    });
                    if (filterOptions.assert) {
                        ctx = await runAssert(ctx, {
                            reporter: filterReporter,
                            ...filterOptions,
                        });
                    }
                    if (filterOptions.post) {
                        await runPost(ctx, {
                            reporter: filterReporter,
                            ...filterOptions,
                        });
                    }
                }
                catch (e) {
                    ctx = setErrorResult(ctx, e);
                    ctx.public.filter = getStepResponse(ctx);
                    if (filter.continueOnError) {
                        ctx.public.ok = true;
                        filterReporter.warning(`Failed to run filter`);
                        filterReporter.warning(e);
                        filterReporter.warning(`Ignore this error, because continueOnError is true.`);
                        break;
                    }
                    else {
                        filterReporter.error(`Failed to run filter`);
                        throw e;
                    }
                }
                if (filterOptions.sleep && filterOptions.sleep > 0) {
                    filterReporter.info(`Sleep ${filterOptions.sleep} seconds`);
                    await delay(filterOptions.sleep * 1000);
                }
            }
            if (ctx.public.items.length > 0) {
                workflowReporter.info(`Start to run steps, will handle ${ctx.public.items.length} items.`);
            }
            ctx.currentStepType = StepType.Step;
            for (let index = 0; index < ctx.public.items.length; index++) {
                ctx.public.itemIndex = index;
                ctx.public.item = ctx.public.items[index];
                if (ctx.public.item &&
                    ctx.public.item["@denoflowKey"]) {
                    ctx.public.itemKey =
                        ctx.public.item["@denoflowKey"];
                }
                else {
                    ctx.public.itemKey = undefined;
                    workflowReporter.warning(`Can not found internal item key \`@denoflowKey\`, maybe you changed the item format. Missing this key, denoflow can not store the unique key state. Fix this, Try not change the reference item, only change the property you need to change. Try to manual adding a \`@denoflowKey\` as item unique key.`);
                }
                if (ctx.public.item &&
                    (ctx.public.item["@denoflowSourceIndex"]) >= 0) {
                    ctx.public.itemSourceIndex =
                        (ctx.public.item["@denoflowSourceIndex"]);
                    ctx.itemSourceOptions =
                        ctx.sourcesOptions[ctx.public.itemSourceIndex];
                }
                else {
                    ctx.itemSourceOptions = undefined;
                    workflowReporter.warning(`Can not found internal item key \`@denoflowSourceIndex\`, maybe you changed the item format. Try not change the reference item, only change the property you need to change. Try to manual adding a \`@denoflowKey\` as item unique key.`);
                }
                const itemReporter = getReporter(`${ctx.public.workflowRelativePath} -> item:${index}`, isDebug);
                if (ctx.public.options?.debug) {
                    itemReporter.level = log.LogLevels.DEBUG;
                }
                if (!workflow.steps) {
                    workflow.steps = [];
                }
                else {
                    itemReporter.info(`Start to handle this item`);
                }
                for (let j = 0; j < workflow.steps.length; j++) {
                    const step = workflow.steps[j];
                    ctx.public.stepIndex = j;
                    const stepReporter = getReporter(`${ctx.public.workflowRelativePath} -> step:${ctx.public.stepIndex}`, isDebug);
                    let stepOptions = { ...step };
                    try {
                        stepOptions = await parseObject(stepOptions, ctx, {
                            keys: ["env"],
                        });
                        stepOptions = await parseObject(stepOptions, ctx, {
                            keys: ["if", "debug"],
                        });
                        if (stepOptions.debug || ctx.public.options?.debug) {
                            stepReporter.level = log.LogLevels.DEBUG;
                        }
                        if (stepOptions.if === false) {
                            stepReporter.info(`Skip this step because if condition is false`);
                            continue;
                        }
                        stepOptions = await parseObject(stepOptions, {
                            ...ctx,
                            public: {
                                ...ctx.public,
                                env: {
                                    ...ctx.public.env,
                                    ...stepOptions.env,
                                },
                            },
                        });
                        stepOptions = getFinalSourceOptions(workflowOptions, cliWorkflowOptions, stepOptions);
                        isDebug = stepOptions.debug || false;
                        stepReporter.debug(`Start run this step.`);
                        ctx = await runStep(ctx, {
                            ...stepOptions,
                            reporter: stepReporter,
                        });
                        if (stepOptions.cmd) {
                            const cmdResult = await runCmd(ctx, stepOptions.cmd);
                            ctx = setCmdOkResult(ctx, cmdResult.stdout);
                        }
                        ctx.public.steps[j] = getStepResponse(ctx);
                        if (step.id) {
                            ctx.public.steps[step.id] = ctx.public.steps[j];
                        }
                        stepReporter.debug(`Finish to run this step.`);
                    }
                    catch (e) {
                        ctx.public.steps[j] = getStepResponse(ctx);
                        if (step.id) {
                            ctx.public.steps[step.id] = ctx.public.steps[j];
                        }
                        if (step.continueOnError) {
                            ctx.public.ok = true;
                            stepReporter.warning(`Failed to run step`);
                            stepReporter.warning(e);
                            stepReporter.warning(`Ignore this error, because continueOnError is true.`);
                            break;
                        }
                        else {
                            stepReporter.error(`Failed to run step`);
                            throw e;
                        }
                    }
                    if (stepOptions.assert) {
                        await runAssert(ctx, {
                            reporter: stepReporter,
                            ...stepOptions,
                        });
                    }
                    if (stepOptions.post) {
                        await runPost(ctx, {
                            reporter: stepReporter,
                            ...stepOptions,
                        });
                    }
                    if (stepOptions.sleep && stepOptions.sleep > 0) {
                        stepReporter.info(`Sleep ${stepOptions.sleep} seconds`);
                        await delay(stepOptions.sleep * 1000);
                    }
                }
                if (ctx.itemSourceOptions && !ctx.itemSourceOptions.force) {
                    if (!ctx.internalState || !ctx.internalState.keys) {
                        ctx.internalState.keys = [];
                    }
                    if (ctx.public.itemKey &&
                        !ctx.internalState.keys.includes(ctx.public.itemKey)) {
                        ctx.internalState.keys.unshift(ctx.public.itemKey);
                    }
                    if (ctx.internalState.keys.length > 1000) {
                        ctx.internalState.keys = ctx.internalState.keys.slice(0, 1000);
                    }
                }
                if (workflow.steps.length > 0) {
                    itemReporter.info(`Finish to run with this item`);
                }
            }
            const currentState = JSON.stringify(ctx.public.state);
            const currentInternalState = JSON.stringify(ctx.internalState);
            if (currentState !== ctx.initState) {
                workflowReporter.debug(`Save state`);
                await ctx.db.set("state", ctx.public.state);
            }
            else {
                workflowReporter.debug(`Skip save sate, cause no change happened`);
            }
            if (currentInternalState !== ctx.initInternalState) {
                workflowReporter.debug(`Save internal state`);
                await ctx.db.set("internalState", ctx.internalState);
            }
            else {
                workflowReporter.debug(`Skip save internal state, cause no change happened`);
            }
            workflowReporter.info(`Finish to run this workflow`);
        }
        catch (e) {
            workflowReporter.error(`Failed to run this workflow`);
            workflowReporter.error(e);
            if (validWorkflows.length > workflowIndex + 1) {
                workflowReporter.info("Skip to run next workflow");
            }
            errors.push({
                ctx,
                error: e
            });
        }
        console.log("\n");
    }
    if (errors.length > 0) {
        errors.forEach(error => {
            report.error(`Run ${error.ctx.public.workflowRelativePath} failed, error: ${error.error} `);
        });
        throw new Error(`Failed to run this time`);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicnVuLXdvcmtmbG93cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInJ1bi13b3JrZmxvd3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBT0EsT0FBTyxFQUFFLG1CQUFtQixFQUFFLE1BQU0saUJBQWlCLENBQUM7QUFDdEQsT0FBTyxFQUFXLFFBQVEsRUFBRSxNQUFNLHlCQUF5QixDQUFDO0FBQzVELE9BQU8sRUFBRSxhQUFhLEVBQUUsTUFBTSxxQkFBcUIsQ0FBQztBQUNwRCxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0saUJBQWlCLENBQUM7QUFDN0MsT0FBTyxFQUFFLGdCQUFnQixFQUFFLE1BQU0sbUJBQW1CLENBQUM7QUFDckQsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLG1CQUFtQixDQUFDO0FBQzdDLE9BQU8sRUFBRSxXQUFXLEVBQUUsTUFBTSxtQkFBbUIsQ0FBQztBQUNoRCxPQUFPLEVBQUUsZUFBZSxFQUFFLE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFDekUsT0FBTyxFQUNMLGNBQWMsRUFDZCx3QkFBd0IsR0FDekIsTUFBTSxtQ0FBbUMsQ0FBQztBQUMzQyxPQUFPLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLFFBQVEsRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUNwRSxPQUFPLE1BQU0sRUFBRSxFQUFFLFdBQVcsRUFBRSxNQUFNLGFBQWEsQ0FBQztBQUNsRCxPQUFPLEVBQUUsS0FBSyxFQUFFLE1BQU0sa0NBQWtDLENBQUM7QUFDekQsT0FBTyxFQUFFLGlCQUFpQixFQUFFLE1BQU0sMEJBQTBCLENBQUM7QUFDN0QsT0FBTyxFQUFFLGVBQWUsRUFBRSxNQUFNLHdCQUF3QixDQUFDO0FBQ3pELE9BQU8sRUFBRSxNQUFNLEVBQUUsY0FBYyxFQUFFLE1BQU0sY0FBYyxDQUFDO0FBQ3RELE9BQU8sRUFDTCxrQkFBa0IsRUFDbEIscUJBQXFCLEVBQ3JCLHVCQUF1QixHQUN4QixN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QUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMxQixJQUFJLGNBQWMsQ0FBQyxNQUFNLEdBQUcsYUFBYSxHQUFHLENBQUMsRUFBRTtnQkFDN0MsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLDJCQUEyQixDQUFDLENBQUM7YUFDcEQ7WUFDRCxNQUFNLENBQUMsSUFBSSxDQUFDO2dCQUNWLEdBQUc7Z0JBQ0gsS0FBSyxFQUFDLENBQUM7YUFDUixDQUFDLENBQUM7U0FDSjtRQUNELE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDbkI7SUFDRCxJQUFJLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO1FBRXJCLE1BQU0sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFBLEVBQUU7WUFDcEIsTUFBTSxDQUFDLEtBQUssQ0FBQyxPQUFPLEtBQUssQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLG9CQUFvQixtQkFBbUIsS0FBSyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUM7UUFDOUYsQ0FBQyxDQUFDLENBQUE7UUFFRixNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUM7S0FDNUM7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgRmlsdGVyT3B0aW9ucyxcbiAgUnVuV29ya2Zsb3dPcHRpb25zLFxuICBTb3VyY2VPcHRpb25zLFxuICBTdGVwT3B0aW9ucyxcbiAgV29ya2Zsb3dPcHRpb25zLFxufSBmcm9tIFwiLi9pbnRlcmZhY2UudHNcIjtcbmltcG9ydCB7IGhhc1Blcm1pc3Npb25TbGllbnQgfSBmcm9tIFwiLi9wZXJtaXNzaW9uLnRzXCI7XG5pbXBvcnQgeyBDb250ZXh0LCBTdGVwVHlwZSB9IGZyb20gXCIuL2ludGVybmFsLWludGVyZmFjZS50c1wiO1xuaW1wb3J0IHsgcGFyc2VXb3JrZmxvdyB9IGZyb20gXCIuL3BhcnNlLXdvcmtmbG93LnRzXCI7XG5pbXBvcnQgeyBnZXRDb250ZW50IH0gZnJvbSBcIi4vdXRpbHMvZmlsZS50c1wiO1xuaW1wb3J0IHsgZ2V0RmlsZXNCeUZpbHRlciB9IGZyb20gXCIuL3V0aWxzL2ZpbHRlci50c1wiO1xuaW1wb3J0IHsgaXNPYmplY3QgfSBmcm9tIFwiLi91dGlscy9vYmplY3QudHNcIjtcbmltcG9ydCB7IHBhcnNlT2JqZWN0IH0gZnJvbSBcIi4vcGFyc2Utb2JqZWN0LnRzXCI7XG5pbXBvcnQgeyBnZXRTdGVwUmVzcG9uc2UsIHJ1blN0ZXAsIHNldEVycm9yUmVzdWx0IH0gZnJvbSBcIi4vcnVuLXN0ZXAudHNcIjtcbmltcG9ydCB7XG4gIGZpbHRlckN0eEl0ZW1zLFxuICBnZXRTb3VyY2VJdGVtc0Zyb21SZXN1bHQsXG59IGZyb20gXCIuL2dldC1zb3VyY2UtaXRlbXMtZnJvbS1yZXN1bHQudHNcIjtcbmltcG9ydCB7IGRlbGF5LCBkaXJuYW1lLCBqb2luLCBsb2csIFNxbGl0ZURiIH0gZnJvbSBcIi4uLy4uL2RlcHMudHNcIjtcbmltcG9ydCByZXBvcnQsIHsgZ2V0UmVwb3J0ZXIgfSBmcm9tIFwiLi9yZXBvcnQudHNcIjtcbmltcG9ydCB7IEtleWRiIH0gZnJvbSBcIi4vYWRhcHRlcnMvanNvbi1zdG9yZS1hZGFwdGVyLnRzXCI7XG5pbXBvcnQgeyBmaWx0ZXJTb3VyY2VJdGVtcyB9IGZyb20gXCIuL2ZpbHRlci1zb3VyY2UtaXRlbXMudHNcIjtcbmltcG9ydCB7IG1hcmtTb3VyY2VJdGVtcyB9IGZyb20gXCIuL21hcmstc291cmNlLWl0ZW1zLnRzXCI7XG5pbXBvcnQgeyBydW5DbWQsIHNldENtZE9rUmVzdWx0IH0gZnJvbSBcIi4vcnVuLWNtZC50c1wiO1xuaW1wb3J0IHtcbiAgZ2V0RmluYWxSdW5PcHRpb25zLFxuICBnZXRGaW5hbFNvdXJjZU9wdGlvbnMsXG4gIGdldEZpbmFsV29ya2Zsb3dPcHRpb25zLFxufSBmcm9tIFwiLi9kZWZhdWx0LW9wdGlvbnMudHNcIjtcbmltcG9ydCB7IHJ1blBvc3QgfSBmcm9tIFwiLi9ydW4tcG9zdC50c1wiO1xuaW1wb3J0IHtydW5Bc3NlcnR9IGZyb20gJy4vcnVuLWFzc2VydC50cyc7XG5pbnRlcmZhY2UgVmFsaWRXb3JrZmxvdyB7XG4gIGN0eDogQ29udGV4dDtcbiAgd29ya2Zsb3c6IFdvcmtmbG93T3B0aW9ucztcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJ1bihydW5PcHRpb25zOiBSdW5Xb3JrZmxvd09wdGlvbnMpIHtcbiAgY29uc3QgZGVidWdFbnZQZXJtbWlzaW9uID0geyBuYW1lOiBcImVudlwiLCB2YXJpYWJsZTogXCJERUJVR1wiIH0gYXMgY29uc3Q7XG4gIGNvbnN0IGRhdGFQZXJtaXNzaW9uID0geyBuYW1lOiBcInJlYWRcIiwgcGF0aDogXCJkYXRhXCIgfSBhcyBjb25zdDtcbiAgbGV0IERlYnVnRW52VmFsdWUgPSB1bmRlZmluZWQ7XG4gIGlmIChhd2FpdCBoYXNQZXJtaXNzaW9uU2xpZW50KGRlYnVnRW52UGVybW1pc2lvbikpIHtcbiAgICBEZWJ1Z0VudlZhbHVlID0gRGVuby5lbnYuZ2V0KFwiREVCVUdcIik7XG4gIH1cbiAgbGV0IGlzRGVidWcgPSAhIShEZWJ1Z0VudlZhbHVlICE9PSB1bmRlZmluZWQgJiYgRGVidWdFbnZWYWx1ZSAhPT0gXCJmYWxzZVwiKTtcblxuICBjb25zdCBjbGlXb3JrZmxvd09wdGlvbnMgPSBnZXRGaW5hbFJ1bk9wdGlvbnMocnVuT3B0aW9ucywgaXNEZWJ1Zyk7XG4gIGlzRGVidWcgPSBjbGlXb3JrZmxvd09wdGlvbnMuZGVidWcgfHwgZmFsc2U7XG4gIGNvbnN0IHtcbiAgICBmaWxlcyxcbiAgfSA9IGNsaVdvcmtmbG93T3B0aW9ucztcblxuICBjb25zdCBjd2QgPSBEZW5vLmN3ZCgpO1xuICBjb25zdCB3b3JrZmxvd0ZpbGVzID0gYXdhaXQgZ2V0RmlsZXNCeUZpbHRlcihjd2QsIGZpbGVzKTtcbiAgbGV0IGVudiA9IHt9O1xuICBjb25zdCBhbGxFbnZQZXJtbWlzaW9uID0geyBuYW1lOiBcImVudlwiIH0gYXMgY29uc3Q7XG5cbiAgaWYgKGF3YWl0IGhhc1Blcm1pc3Npb25TbGllbnQoYWxsRW52UGVybW1pc2lvbikpIHtcbiAgICBlbnYgPSBEZW5vLmVudi50b09iamVjdCgpO1xuICB9XG4gIC8vIGdldCBvcHRpb25zXG4gIGxldCB2YWxpZFdvcmtmbG93czogVmFsaWRXb3JrZmxvd1tdID0gW107XG4gIGNvbnN0IGVycm9ycyA9IFtdO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHdvcmtmbG93RmlsZXMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCB3b3JrZmxvd1JlbGF0aXZlUGF0aCA9IHdvcmtmbG93RmlsZXNbaV07XG4gICAgY29uc3Qgd29ya2Zsb3dGaWxlUGF0aCA9IGpvaW4oY3dkLCB3b3JrZmxvd1JlbGF0aXZlUGF0aCk7XG4gICAgY29uc3QgZmlsZUNvbnRlbnQgPSBhd2FpdCBnZXRDb250ZW50KHdvcmtmbG93RmlsZVBhdGgpO1xuICAgIGNvbnN0IHdvcmtmbG93ID0gcGFyc2VXb3JrZmxvdyhmaWxlQ29udGVudCk7XG4gICAgaWYgKCFpc09iamVjdCh3b3JrZmxvdykpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIHZhbGlkV29ya2Zsb3dzLnB1c2goe1xuICAgICAgY3R4OiB7XG4gICAgICAgIHB1YmxpYzoge1xuICAgICAgICAgIGVudixcbiAgICAgICAgICB3b3JrZmxvd1BhdGg6IHdvcmtmbG93RmlsZVBhdGgsXG4gICAgICAgICAgd29ya2Zsb3dSZWxhdGl2ZVBhdGg6IHdvcmtmbG93UmVsYXRpdmVQYXRoLFxuICAgICAgICAgIHdvcmtmbG93Q3dkOiBkaXJuYW1lKHdvcmtmbG93RmlsZVBhdGgpLFxuICAgICAgICAgIGN3ZDogY3dkLFxuICAgICAgICAgIHNvdXJjZXM6IHt9LFxuICAgICAgICAgIHN0ZXBzOiB7fSxcbiAgICAgICAgICBzdGF0ZTogdW5kZWZpbmVkLFxuICAgICAgICAgIGl0ZW1zOiBbXSxcbiAgICAgICAgfSxcbiAgICAgICAgaXRlbVNvdXJjZU9wdGlvbnM6IHVuZGVmaW5lZCxcbiAgICAgICAgc291cmNlc09wdGlvbnM6IFtdLFxuICAgICAgICBjdXJyZW50U3RlcFR5cGU6IFN0ZXBUeXBlLlNvdXJjZSxcbiAgICAgIH0sXG4gICAgICB3b3JrZmxvdzogd29ya2Zsb3csXG4gICAgfSk7XG4gICAgLy8gcnVuIGNvZGVcbiAgfVxuICAvLyBzb3J0IGJ5IGFscGhhYmV0XG4gIHZhbGlkV29ya2Zsb3dzID0gdmFsaWRXb3JrZmxvd3Muc29ydCgoYSwgYikgPT4ge1xuICAgIGNvbnN0IGFQYXRoID0gYS5jdHgucHVibGljLndvcmtmbG93UmVsYXRpdmVQYXRoO1xuICAgIGNvbnN0IGJQYXRoID0gYi5jdHgucHVibGljLndvcmtmbG93UmVsYXRpdmVQYXRoO1xuICAgIGlmIChhUGF0aCA8IGJQYXRoKSB7XG4gICAgICByZXR1cm4gLTE7XG4gICAgfVxuICAgIGlmIChhUGF0aCA+IGJQYXRoKSB7XG4gICAgICByZXR1cm4gMTtcbiAgICB9XG4gICAgcmV0dXJuIDA7XG4gIH0pO1xuICByZXBvcnQuaW5mbyhcbiAgICBgRm91bmQgJHt2YWxpZFdvcmtmbG93cy5sZW5ndGh9IHZhbGlkIHdvcmtmbG93czpcXG4ke1xuICAgICAgdmFsaWRXb3JrZmxvd3MubWFwKChpdGVtKSA9PiBpdGVtLmN0eC5wdWJsaWMud29ya2Zsb3dSZWxhdGl2ZVBhdGgpLmpvaW4oXG4gICAgICAgIFwiXFxuXCIsXG4gICAgICApXG4gICAgfWAsXG4gICk7XG4gIC8vIHJ1biB3b3JrZmxvd3Mgc3RlcCBieSBzdGVwXG4gIGZvciAoXG4gICAgbGV0IHdvcmtmbG93SW5kZXggPSAwO1xuICAgIHdvcmtmbG93SW5kZXggPCB2YWxpZFdvcmtmbG93cy5sZW5ndGg7XG4gICAgd29ya2Zsb3dJbmRleCsrXG4gICkge1xuICAgIGxldCB7IGN0eCwgd29ya2Zsb3cgfSA9IHZhbGlkV29ya2Zsb3dzW3dvcmtmbG93SW5kZXhdO1xuICAgIC8vIHBhcnNlIHJvb3QgZW52IGZpcnN0XG4gICAgLy8gcGFyc2UgZW52IGZpcnN0XG4gICAgY29uc3QgcGFyc2VkV29ya2Zsb3dGaWxlT3B0aW9uc1dpdGhFbnYgPSBhd2FpdCBwYXJzZU9iamVjdCh3b3JrZmxvdywgY3R4LCB7XG4gICAgICBrZXlzOiBbXCJlbnZcIl0sXG4gICAgfSkgYXMgV29ya2Zsb3dPcHRpb25zO1xuICAgIC8vIHJ1biBlbnZcbiAgICAvLyBwYXJzZSBlbnYgdG8gZW52XG4gICAgaWYgKHBhcnNlZFdvcmtmbG93RmlsZU9wdGlvbnNXaXRoRW52LmVudikge1xuICAgICAgZm9yIChjb25zdCBrZXkgaW4gcGFyc2VkV29ya2Zsb3dGaWxlT3B0aW9uc1dpdGhFbnYuZW52KSB7XG4gICAgICAgIGNvbnN0IHZhbHVlID0gcGFyc2VkV29ya2Zsb3dGaWxlT3B0aW9uc1dpdGhFbnYuZW52W2tleV07XG4gICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICBEZW5vLmVudi5zZXQoa2V5LCB2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBwYXJzZSBnZW5lcmFsIG9wdGlvbnNcblxuICAgIGNvbnN0IHBhcnNlZFdvcmtmbG93R2VuZXJhbE9wdGlvbnNXaXRoR2VuZXJhbCA9IGF3YWl0IHBhcnNlT2JqZWN0KFxuICAgICAgcGFyc2VkV29ya2Zsb3dGaWxlT3B0aW9uc1dpdGhFbnYsXG4gICAgICBjdHgsXG4gICAgICB7XG4gICAgICAgIGtleXM6IFtcImlmXCIsIFwiZGVidWdcIiwgXCJkYXRhYmFzZVwiLCBcInNsZWVwXCIsIFwibGltaXRcIiwgXCJmb3JjZVwiXSxcbiAgICAgIH0sXG4gICAgKSBhcyBXb3JrZmxvd09wdGlvbnM7XG5cbiAgICBjb25zdCB3b3JrZmxvd09wdGlvbnMgPSBnZXRGaW5hbFdvcmtmbG93T3B0aW9ucyhcbiAgICAgIGNsaVdvcmtmbG93T3B0aW9ucyxcbiAgICAgIHBhcnNlZFdvcmtmbG93R2VuZXJhbE9wdGlvbnNXaXRoR2VuZXJhbCB8fFxuICAgICAgICB7fSxcbiAgICApO1xuICAgIGlzRGVidWcgPSB3b3JrZmxvd09wdGlvbnMuZGVidWcgfHwgZmFsc2U7XG5cbiAgICBjb25zdCB3b3JrZmxvd1JlcG9ydGVyID0gZ2V0UmVwb3J0ZXIoXG4gICAgICBgJHtjdHgucHVibGljLndvcmtmbG93UmVsYXRpdmVQYXRofWAsXG4gICAgICBpc0RlYnVnLFxuICAgICk7XG5cbiAgICAvLyBjaGVjayBpZiBuZWVkIHRvIHJ1blxuICAgIGlmICh3b3JrZmxvd09wdGlvbnM/LmlmID09PSBmYWxzZSkge1xuICAgICAgd29ya2Zsb3dSZXBvcnRlci5pbmZvKFxuICAgICAgICBgU2tpcCB0aGlzIHdvcmtmbG93IGJlY2F1c2UgaWYgY29uZGl0aW9uIGlzIGZhbHNlYCxcbiAgICAgICk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICAvLyBtZXJnZSB0byBnZXQgZGVmYXVsdFxuICAgIGN0eC5wdWJsaWMub3B0aW9ucyA9IHdvcmtmbG93T3B0aW9ucztcblxuICAgIGNvbnN0IGRhdGFiYXNlID0gd29ya2Zsb3dPcHRpb25zLmRhdGFiYXNlO1xuICAgIGxldCBkYjtcbiAgICBpZiAoZGF0YWJhc2U/LnN0YXJ0c1dpdGgoXCJzcWxpdGVcIikpIHtcbiAgICAgIGRiID0gbmV3IFNxbGl0ZURiKGRhdGFiYXNlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZGIgPSBuZXcgS2V5ZGIoZGF0YWJhc2UsIHtcbiAgICAgICAgbmFtZXNwYWNlOiBjdHgucHVibGljLndvcmtmbG93UmVsYXRpdmVQYXRoLFxuICAgICAgfSk7XG4gICAgfVxuICAgIGN0eC5kYiA9IGRiO1xuICAgIC8vIGNoZWNrIHBlcm1pc3Npb25cbiAgICAvLyB1bmlxdWUga2V5XG4gICAgbGV0IHN0YXRlO1xuICAgIGxldCBpbnRlcm5hbFN0YXRlID0ge1xuICAgICAga2V5czogW10sXG4gICAgfTtcbiAgICBpZiAoYXdhaXQgaGFzUGVybWlzc2lvblNsaWVudChkYXRhUGVybWlzc2lvbikpIHtcbiAgICAgIHN0YXRlID0gYXdhaXQgZGIuZ2V0KFwic3RhdGVcIikgfHwgdW5kZWZpbmVkO1xuICAgICAgaW50ZXJuYWxTdGF0ZSA9IGF3YWl0IGRiLmdldChcImludGVybmFsU3RhdGVcIikgfHwge1xuICAgICAgICBrZXlzOiBbXSxcbiAgICAgIH07XG4gICAgfVxuICAgIGN0eC5wdWJsaWMuc3RhdGUgPSBzdGF0ZTtcbiAgICBjdHguaW50ZXJuYWxTdGF0ZSA9IGludGVybmFsU3RhdGU7XG4gICAgY3R4LmluaXRTdGF0ZSA9IEpTT04uc3RyaW5naWZ5KHN0YXRlKTtcbiAgICBjdHguaW5pdEludGVybmFsU3RhdGUgPSBKU09OLnN0cmluZ2lmeShpbnRlcm5hbFN0YXRlKTtcblxuICAgIGNvbnN0IHNvdXJjZXMgPSB3b3JrZmxvdy5zb3VyY2VzO1xuXG4gICAgdHJ5IHtcbiAgICAgIGlmIChzb3VyY2VzKSB7XG4gICAgICAgIGZvciAobGV0IHNvdXJjZUluZGV4ID0gMDsgc291cmNlSW5kZXggPCBzb3VyY2VzLmxlbmd0aDsgc291cmNlSW5kZXgrKykge1xuICAgICAgICAgIGNvbnN0IHNvdXJjZSA9IHNvdXJjZXNbc291cmNlSW5kZXhdO1xuICAgICAgICAgIGN0eC5wdWJsaWMuc291cmNlSW5kZXggPSBzb3VyY2VJbmRleDtcbiAgICAgICAgICBjb25zdCBzb3VyY2VSZXBvcnRlciA9IGdldFJlcG9ydGVyKFxuICAgICAgICAgICAgYCR7Y3R4LnB1YmxpYy53b3JrZmxvd1JlbGF0aXZlUGF0aH0gLT4gc291cmNlOiR7Y3R4LnB1YmxpYy5zb3VyY2VJbmRleH1gLFxuICAgICAgICAgICAgaXNEZWJ1ZyxcbiAgICAgICAgICApO1xuICAgICAgICAgIGxldCBzb3VyY2VPcHRpb25zID0ge1xuICAgICAgICAgICAgLi4uc291cmNlLFxuICAgICAgICAgIH07XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIHBhcnNlIGVudiBmaXJzdFxuICAgICAgICAgICAgc291cmNlT3B0aW9ucyA9IGF3YWl0IHBhcnNlT2JqZWN0KHNvdXJjZSwgY3R4LCB7XG4gICAgICAgICAgICAgIGtleXM6IFtcImVudlwiXSxcbiAgICAgICAgICAgIH0pIGFzIFNvdXJjZU9wdGlvbnM7XG5cbiAgICAgICAgICAgIC8vIHBhcnNlIGlmIG9ubHlcbiAgICAgICAgICAgIHNvdXJjZU9wdGlvbnMgPSBhd2FpdCBwYXJzZU9iamVjdChcbiAgICAgICAgICAgICAgc291cmNlT3B0aW9ucyxcbiAgICAgICAgICAgICAgY3R4LFxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAga2V5czogW1wiaWZcIiwgXCJkZWJ1Z1wiXSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICkgYXMgU291cmNlT3B0aW9ucztcblxuICAgICAgICAgICAgLy8gc2V0IGxvZyBsZXZlbFxuICAgICAgICAgICAgaWYgKHNvdXJjZU9wdGlvbnM/LmRlYnVnIHx8IGN0eC5wdWJsaWMub3B0aW9ucz8uZGVidWcpIHtcbiAgICAgICAgICAgICAgc291cmNlUmVwb3J0ZXIubGV2ZWwgPSBsb2cuTG9nTGV2ZWxzLkRFQlVHO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBjaGVjayBpZiBuZWVkIHRvIHJ1blxuICAgICAgICAgICAgaWYgKHNvdXJjZU9wdGlvbnMuaWYgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgIHNvdXJjZVJlcG9ydGVyLmluZm8oXG4gICAgICAgICAgICAgICAgYFNraXAgdGhpcyBzb3VyY2UgYmVjYXVzZSBpZiBjb25kaXRpb24gaXMgZmFsc2VgLFxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gcGFyc2Ugb25cbiAgICAgICAgICAgIC8vIGluc2VydCBzdGVwIGVudlxuICAgICAgICAgICAgc291cmNlT3B0aW9ucyA9IGF3YWl0IHBhcnNlT2JqZWN0KFxuICAgICAgICAgICAgICBzb3VyY2VPcHRpb25zLFxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgLi4uY3R4LFxuICAgICAgICAgICAgICAgIHB1YmxpYzoge1xuICAgICAgICAgICAgICAgICAgLi4uY3R4LnB1YmxpYyxcbiAgICAgICAgICAgICAgICAgIGVudjoge1xuICAgICAgICAgICAgICAgICAgICAuLi5jdHgucHVibGljLmVudixcbiAgICAgICAgICAgICAgICAgICAgLi4uc291cmNlT3B0aW9ucy5lbnYsXG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICApIGFzIFNvdXJjZU9wdGlvbnM7XG5cbiAgICAgICAgICAgIC8vIGdldCBvcHRpb25zXG4gICAgICAgICAgICBzb3VyY2VPcHRpb25zID0gZ2V0RmluYWxTb3VyY2VPcHRpb25zKFxuICAgICAgICAgICAgICB3b3JrZmxvd09wdGlvbnMsXG4gICAgICAgICAgICAgIGNsaVdvcmtmbG93T3B0aW9ucyxcbiAgICAgICAgICAgICAgc291cmNlT3B0aW9ucyxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBpc0RlYnVnID0gc291cmNlT3B0aW9ucy5kZWJ1ZyB8fCBmYWxzZTtcblxuICAgICAgICAgICAgY3R4LnNvdXJjZXNPcHRpb25zLnB1c2goc291cmNlT3B0aW9ucyk7XG4gICAgICAgICAgICAvLyBydW4gc291cmNlXG4gICAgICAgICAgICBjdHggPSBhd2FpdCBydW5TdGVwKGN0eCwge1xuICAgICAgICAgICAgICByZXBvcnRlcjogc291cmNlUmVwb3J0ZXIsXG4gICAgICAgICAgICAgIC4uLnNvdXJjZU9wdGlvbnMsXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgLy8gZ2V0IHNvdXJjZSBpdGVtcyBieSBpdGVtc1BhdGgsIGtleVxuICAgICAgICAgICAgY3R4ID0gYXdhaXQgZ2V0U291cmNlSXRlbXNGcm9tUmVzdWx0KGN0eCwge1xuICAgICAgICAgICAgICAuLi5zb3VyY2VPcHRpb25zLFxuICAgICAgICAgICAgICByZXBvcnRlcjogc291cmNlUmVwb3J0ZXIsXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgLy8gcnVuIHVzZXIgZmlsdGVyLCBmaWx0ZXIgZnJvbSwgZmlsdGVySXRlbXMsIGZpbHRlckl0ZW1zRnJvbSwgb25seSBhbGxvdyBvbmUuXG4gICAgICAgICAgICBjdHggPSBhd2FpdCBmaWx0ZXJTb3VyY2VJdGVtcyhjdHgsIHNvdXJjZVJlcG9ydGVyKTtcblxuICAgICAgICAgICAgLy8gcnVuIGNtZFxuXG4gICAgICAgICAgICBpZiAoc291cmNlT3B0aW9ucy5jbWQpIHtcbiAgICAgICAgICAgICAgY29uc3QgY21kUmVzdWx0ID0gYXdhaXQgcnVuQ21kKGN0eCwgc291cmNlT3B0aW9ucy5jbWQpO1xuICAgICAgICAgICAgICBjdHggPSBzZXRDbWRPa1Jlc3VsdChjdHgsIGNtZFJlc3VsdC5zdGRvdXQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZihzb3VyY2VPcHRpb25zLnJldmVyc2Upe1xuICAgICAgICAgICAgICAvLyByZXZlcnNlXG4gICAgICAgICAgICAgIGN0eC5wdWJsaWMuaXRlbXMgPSBjdHgucHVibGljLml0ZW1zLnJldmVyc2UoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gbWFyayBzb3VyY2UgaXRlbXMsIGFkZCB1bmlxdWUga2V5IGFuZCBzb3VyY2UgaW5kZXggdG8gaXRlbXNcbiAgICAgICAgICAgIGN0eCA9IG1hcmtTb3VyY2VJdGVtcyhjdHgpO1xuICAgICAgICAgICAgY3R4LnB1YmxpYy5zb3VyY2VzW3NvdXJjZUluZGV4XSA9IGdldFN0ZXBSZXNwb25zZShjdHgpO1xuICAgICAgICAgICAgaWYgKHNvdXJjZU9wdGlvbnMuaWQpIHtcbiAgICAgICAgICAgICAgY3R4LnB1YmxpYy5zb3VyY2VzW3NvdXJjZU9wdGlvbnMuaWRdID1cbiAgICAgICAgICAgICAgICBjdHgucHVibGljLnNvdXJjZXNbc291cmNlSW5kZXhdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBydW4gYXNzZXJ0XG4gICAgICAgICAgICBpZiAoc291cmNlT3B0aW9ucy5hc3NlcnQpIHtcbiAgICAgICAgICAgICAgY3R4ID0gYXdhaXQgcnVuQXNzZXJ0KGN0eCx7XG4gICAgICAgICAgICAgICAgcmVwb3J0ZXI6IHNvdXJjZVJlcG9ydGVyLFxuICAgICAgICAgICAgICAgIC4uLnNvdXJjZU9wdGlvbnMsXG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gcnVuIHBvc3RcblxuICAgICAgICAgICAgaWYgKHNvdXJjZU9wdGlvbnMucG9zdCkge1xuICAgICAgICAgICAgICBhd2FpdCBydW5Qb3N0KGN0eCwge1xuICAgICAgICAgICAgICAgIHJlcG9ydGVyOiBzb3VyY2VSZXBvcnRlcixcbiAgICAgICAgICAgICAgICAuLi5zb3VyY2VPcHRpb25zLFxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjdHggPSBzZXRFcnJvclJlc3VsdChjdHgsIGUpO1xuICAgICAgICAgICAgY3R4LnB1YmxpYy5zb3VyY2VzW3NvdXJjZUluZGV4XSA9IGdldFN0ZXBSZXNwb25zZShjdHgpO1xuICAgICAgICAgICAgaWYgKHNvdXJjZS5pZCkge1xuICAgICAgICAgICAgICBjdHgucHVibGljLnNvdXJjZXNbc291cmNlLmlkXSA9IGN0eC5wdWJsaWMuc291cmNlc1tzb3VyY2VJbmRleF07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoc291cmNlLmNvbnRpbnVlT25FcnJvcikge1xuICAgICAgICAgICAgICBjdHgucHVibGljLm9rID0gdHJ1ZTtcbiAgICAgICAgICAgICAgc291cmNlUmVwb3J0ZXIud2FybmluZyhcbiAgICAgICAgICAgICAgICBgRmFpbGVkIHRvIHJ1biBzb3VyY2VgLFxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICBzb3VyY2VSZXBvcnRlci53YXJuaW5nKGUpO1xuICAgICAgICAgICAgICBzb3VyY2VSZXBvcnRlci53YXJuaW5nKFxuICAgICAgICAgICAgICAgIGBJZ25vcmUgdGhpcyBlcnJvciwgYmVjYXVzZSBjb250aW51ZU9uRXJyb3IgaXMgdHJ1ZS5gLFxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHNvdXJjZVJlcG9ydGVyLmVycm9yKFxuICAgICAgICAgICAgICAgIGBGYWlsZWQgdG8gcnVuIHNvdXJjZWAsXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgIHRocm93IGU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gY2hlY2sgaXMgbmVlZCBzbGVlcFxuICAgICAgICAgIGlmIChzb3VyY2VPcHRpb25zLnNsZWVwICYmIHNvdXJjZU9wdGlvbnMuc2xlZXAgPiAwKSB7XG4gICAgICAgICAgICBzb3VyY2VSZXBvcnRlci5pbmZvKFxuICAgICAgICAgICAgICBgU2xlZXAgJHtzb3VyY2VPcHRpb25zLnNsZWVwfSBzZWNvbmRzYCxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBhd2FpdCBkZWxheShzb3VyY2VPcHRpb25zLnNsZWVwICogMTAwMCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIGluc2VydCBuZXcgY3R4Lml0ZW1zXG4gICAgICBpZiAoc291cmNlcykge1xuICAgICAgICBsZXQgY29sbGVjdEN0eEl0ZW1zOiB1bmtub3duW10gPSBbXTtcbiAgICAgICAgc291cmNlcy5mb3JFYWNoKChfLCB0aGVTb3VyY2VJbmRleCkgPT4ge1xuICAgICAgICAgIGNvbGxlY3RDdHhJdGVtcyA9IGNvbGxlY3RDdHhJdGVtcy5jb25jYXQoXG4gICAgICAgICAgICBjdHgucHVibGljLnNvdXJjZXNbdGhlU291cmNlSW5kZXhdLnJlc3VsdCxcbiAgICAgICAgICApO1xuICAgICAgICB9KTtcbiAgICAgICAgY3R4LnB1YmxpYy5pdGVtcyA9IGNvbGxlY3RDdHhJdGVtcztcbiAgICAgIH1cblxuICAgICAgLy8gaWYgaXRlbXMgPjAsIHRoZW4gY29udGludWVcbiAgICAgIGlmICgoY3R4LnB1YmxpYy5pdGVtcyBhcyB1bmtub3duW10pLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAvLyBubyBuZWVkIHRvIGhhbmRsZSBzdGVwc1xuICAgICAgICB3b3JrZmxvd1JlcG9ydGVyLmluZm8oXG4gICAgICAgICAgYFNraXAgdGhpcyB3b3JrZmxvdyBiZWNhdXNlIG5vIGFueSB2YWxpZCBzb3VyY2VzIGl0ZW1zIHJldHVybmVkYCxcbiAgICAgICAgKTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIC8vIHJ1biBmaWx0ZXJcbiAgICAgIGNvbnN0IGZpbHRlciA9IHdvcmtmbG93LmZpbHRlcjtcbiAgICAgIGlmIChmaWx0ZXIpIHtcbiAgICAgICAgY3R4LmN1cnJlbnRTdGVwVHlwZSA9IFN0ZXBUeXBlLkZpbHRlcjtcbiAgICAgICAgY29uc3QgZmlsdGVyUmVwb3J0ZXIgPSBnZXRSZXBvcnRlcihcbiAgICAgICAgICBgJHtjdHgucHVibGljLndvcmtmbG93UmVsYXRpdmVQYXRofSAtPiBmaWx0ZXJgLFxuICAgICAgICAgIGlzRGVidWcsXG4gICAgICAgICk7XG4gICAgICAgIGxldCBmaWx0ZXJPcHRpb25zID0geyAuLi5maWx0ZXIgfTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAvLyBwYXJzZSBlbnYgZmlyc3RcbiAgICAgICAgICBmaWx0ZXJPcHRpb25zID0gYXdhaXQgcGFyc2VPYmplY3QoZmlsdGVyLCBjdHgsIHtcbiAgICAgICAgICAgIGtleXM6IFtcImVudlwiXSxcbiAgICAgICAgICB9KSBhcyBGaWx0ZXJPcHRpb25zO1xuXG4gICAgICAgICAgLy8gcGFyc2UgaWYgZGVidWcgb25seVxuICAgICAgICAgIGZpbHRlck9wdGlvbnMgPSBhd2FpdCBwYXJzZU9iamVjdChcbiAgICAgICAgICAgIGZpbHRlck9wdGlvbnMsXG4gICAgICAgICAgICBjdHgsXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGtleXM6IFtcImlmXCIsIFwiZGVidWdcIl0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICkgYXMgRmlsdGVyT3B0aW9ucztcblxuICAgICAgICAgIC8vIHNldCBsb2cgbGV2ZWxcbiAgICAgICAgICBpZiAoZmlsdGVyT3B0aW9ucz8uZGVidWcgfHwgY3R4LnB1YmxpYy5vcHRpb25zPy5kZWJ1Zykge1xuICAgICAgICAgICAgZmlsdGVyUmVwb3J0ZXIubGV2ZWwgPSBsb2cuTG9nTGV2ZWxzLkRFQlVHO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIGNoZWNrIGlmIG5lZWQgdG8gcnVuXG4gICAgICAgICAgaWYgKGZpbHRlck9wdGlvbnMuaWYgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICBmaWx0ZXJSZXBvcnRlci5pbmZvKFxuICAgICAgICAgICAgICBgU2tpcCB0aGlzIEZpbHRlciBiZWNhdXNlIGlmIGNvbmRpdGlvbiBpcyBmYWxzZWAsXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gcGFyc2Ugb25cbiAgICAgICAgICAvLyBpbnNlcnQgc3RlcCBlbnZcbiAgICAgICAgICBmaWx0ZXJPcHRpb25zID0gYXdhaXQgcGFyc2VPYmplY3QoXG4gICAgICAgICAgICBmaWx0ZXJPcHRpb25zLFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAuLi5jdHgsXG4gICAgICAgICAgICAgIHB1YmxpYzoge1xuICAgICAgICAgICAgICAgIC4uLmN0eC5wdWJsaWMsXG4gICAgICAgICAgICAgICAgZW52OiB7XG4gICAgICAgICAgICAgICAgICAuLi5jdHgucHVibGljLmVudixcbiAgICAgICAgICAgICAgICAgIC4uLmZpbHRlck9wdGlvbnMuZW52LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICkgYXMgRmlsdGVyT3B0aW9ucztcblxuICAgICAgICAgIC8vIGdldCBvcHRpb25zXG4gICAgICAgICAgZmlsdGVyT3B0aW9ucyA9IGdldEZpbmFsU291cmNlT3B0aW9ucyhcbiAgICAgICAgICAgIHdvcmtmbG93T3B0aW9ucyxcbiAgICAgICAgICAgIGNsaVdvcmtmbG93T3B0aW9ucyxcbiAgICAgICAgICAgIGZpbHRlck9wdGlvbnMsXG4gICAgICAgICAgKTtcbiAgICAgICAgICBpc0RlYnVnID0gZmlsdGVyT3B0aW9ucy5kZWJ1ZyB8fCBmYWxzZTtcblxuICAgICAgICAgIC8vIHJ1biBGaWx0ZXJcbiAgICAgICAgICBjdHggPSBhd2FpdCBydW5TdGVwKGN0eCwge1xuICAgICAgICAgICAgcmVwb3J0ZXI6IGZpbHRlclJlcG9ydGVyLFxuICAgICAgICAgICAgLi4uZmlsdGVyT3B0aW9ucyxcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBpZiAoXG4gICAgICAgICAgICBBcnJheS5pc0FycmF5KGN0eC5wdWJsaWMucmVzdWx0KSAmJlxuICAgICAgICAgICAgY3R4LnB1YmxpYy5yZXN1bHQubGVuZ3RoID09PSBjdHgucHVibGljLml0ZW1zLmxlbmd0aFxuICAgICAgICAgICkge1xuICAgICAgICAgICAgY3R4LnB1YmxpYy5pdGVtcyA9IGN0eC5wdWJsaWMuaXRlbXMuZmlsdGVyKChfaXRlbSwgaW5kZXgpID0+IHtcbiAgICAgICAgICAgICAgcmV0dXJuICEhKChjdHgucHVibGljLnJlc3VsdCBhcyBib29sZWFuW10pW2luZGV4XSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGN0eC5wdWJsaWMucmVzdWx0ID0gY3R4LnB1YmxpYy5pdGVtcztcbiAgICAgICAgICB9IGVsc2UgaWYgKGZpbHRlck9wdGlvbnMucnVuIHx8IGZpbHRlck9wdGlvbnMudXNlKSB7XG4gICAgICAgICAgICAvLyBpZiBydW4gb3IgdXNlLCB0aGVuIHJlc3VsdCBtdXN0IGJlIGFycmF5XG4gICAgICAgICAgICBmaWx0ZXJSZXBvcnRlci5lcnJvcihcbiAgICAgICAgICAgICAgYEZhaWxlZCB0byBydW4gZmlsdGVyIHNjcmlwdGAsXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgLy8gaW52YWxpZCByZXN1bHRcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAgICAgXCJJbnZhbGlkIGZpbHRlciBzdGVwIHJlc3VsdCwgcmVzdWx0IG11c3QgYmUgYXJyYXkgLCBib29sZWFuW10sIHdoaWNoIGFycmF5IGxlbmd0aCBtdXN0IGJlIGVxdWFsIHRvIGN0eC5pdGVtcyBsZW5ndGhcIixcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGZpbHRlck9wdGlvbnMuY21kKSB7XG4gICAgICAgICAgICBjb25zdCBjbWRSZXN1bHQgPSBhd2FpdCBydW5DbWQoY3R4LCBmaWx0ZXJPcHRpb25zLmNtZCk7XG4gICAgICAgICAgICBjdHggPSBzZXRDbWRPa1Jlc3VsdChjdHgsIGNtZFJlc3VsdC5zdGRvdXQpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjdHgucHVibGljLmZpbHRlciA9IGdldFN0ZXBSZXNwb25zZShjdHgpO1xuXG4gICAgICAgICAgLy8gcnVuIGZpbHRlclxuICAgICAgICAgIGN0eCA9IGZpbHRlckN0eEl0ZW1zKGN0eCwge1xuICAgICAgICAgICAgLi4uZmlsdGVyT3B0aW9ucyxcbiAgICAgICAgICAgIHJlcG9ydGVyOiBmaWx0ZXJSZXBvcnRlcixcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIC8vIHJ1biBhc3NlcnRcbiAgICAgICAgICBpZiAoZmlsdGVyT3B0aW9ucy5hc3NlcnQpIHtcbiAgICAgICAgICAgIGN0eCA9IGF3YWl0IHJ1bkFzc2VydChjdHgse1xuICAgICAgICAgICAgICByZXBvcnRlcjogZmlsdGVyUmVwb3J0ZXIsXG4gICAgICAgICAgICAgIC4uLmZpbHRlck9wdGlvbnMsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBydW4gcG9zdFxuXG4gICAgICAgICAgaWYgKGZpbHRlck9wdGlvbnMucG9zdCkge1xuICAgICAgICAgICAgYXdhaXQgcnVuUG9zdChjdHgsIHtcbiAgICAgICAgICAgICAgcmVwb3J0ZXI6IGZpbHRlclJlcG9ydGVyLFxuICAgICAgICAgICAgICAuLi5maWx0ZXJPcHRpb25zLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICBjdHggPSBzZXRFcnJvclJlc3VsdChjdHgsIGUpO1xuICAgICAgICAgIGN0eC5wdWJsaWMuZmlsdGVyID0gZ2V0U3RlcFJlc3BvbnNlKGN0eCk7XG5cbiAgICAgICAgICBpZiAoZmlsdGVyLmNvbnRpbnVlT25FcnJvcikge1xuICAgICAgICAgICAgY3R4LnB1YmxpYy5vayA9IHRydWU7XG4gICAgICAgICAgICBmaWx0ZXJSZXBvcnRlci53YXJuaW5nKFxuICAgICAgICAgICAgICBgRmFpbGVkIHRvIHJ1biBmaWx0ZXJgLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIGZpbHRlclJlcG9ydGVyLndhcm5pbmcoZSk7XG4gICAgICAgICAgICBmaWx0ZXJSZXBvcnRlci53YXJuaW5nKFxuICAgICAgICAgICAgICBgSWdub3JlIHRoaXMgZXJyb3IsIGJlY2F1c2UgY29udGludWVPbkVycm9yIGlzIHRydWUuYCxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZmlsdGVyUmVwb3J0ZXIuZXJyb3IoXG4gICAgICAgICAgICAgIGBGYWlsZWQgdG8gcnVuIGZpbHRlcmAsXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gY2hlY2sgaXMgbmVlZCBzbGVlcFxuICAgICAgICBpZiAoZmlsdGVyT3B0aW9ucy5zbGVlcCAmJiBmaWx0ZXJPcHRpb25zLnNsZWVwID4gMCkge1xuICAgICAgICAgIGZpbHRlclJlcG9ydGVyLmluZm8oXG4gICAgICAgICAgICBgU2xlZXAgJHtmaWx0ZXJPcHRpb25zLnNsZWVwfSBzZWNvbmRzYCxcbiAgICAgICAgICApO1xuICAgICAgICAgIGF3YWl0IGRlbGF5KGZpbHRlck9wdGlvbnMuc2xlZXAgKiAxMDAwKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBydW4gc3RlcHNcbiAgICAgIGlmICgoY3R4LnB1YmxpYy5pdGVtcyBhcyB1bmtub3duW10pLmxlbmd0aD4gMCkge1xuICAgICAgICB3b3JrZmxvd1JlcG9ydGVyLmluZm8oXG4gICAgICAgICAgYFN0YXJ0IHRvIHJ1biBzdGVwcywgd2lsbCBoYW5kbGUgJHtcbiAgICAgICAgICAgIChjdHgucHVibGljLml0ZW1zIGFzIHVua25vd25bXSkubGVuZ3RoXG4gICAgICAgICAgfSBpdGVtcy5gLFxuICAgICAgICApO1xuICAgICAgfVxuICAgICAgY3R4LmN1cnJlbnRTdGVwVHlwZSA9IFN0ZXBUeXBlLlN0ZXA7XG5cbiAgICAgIGZvciAoXG4gICAgICAgIGxldCBpbmRleCA9IDA7XG4gICAgICAgIGluZGV4IDwgKGN0eC5wdWJsaWMuaXRlbXMgYXMgdW5rbm93bltdKS5sZW5ndGg7XG4gICAgICAgIGluZGV4KytcbiAgICAgICkge1xuICAgICAgXG4gICAgICAgIGN0eC5wdWJsaWMuaXRlbUluZGV4ID0gaW5kZXg7XG4gICAgICAgIGN0eC5wdWJsaWMuaXRlbSA9IChjdHgucHVibGljLml0ZW1zIGFzIHVua25vd25bXSlbaW5kZXhdO1xuICAgICAgICBpZiAoXG4gICAgICAgICAgKGN0eC5wdWJsaWMuaXRlbSBhcyBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+KSAmJlxuICAgICAgICAgIChjdHgucHVibGljLml0ZW0gYXMgUmVjb3JkPHN0cmluZywgc3RyaW5nPilbXCJAZGVub2Zsb3dLZXlcIl1cbiAgICAgICAgKSB7XG4gICAgICAgICAgY3R4LnB1YmxpYy5pdGVtS2V5ID1cbiAgICAgICAgICAgIChjdHgucHVibGljLml0ZW0gYXMgUmVjb3JkPHN0cmluZywgc3RyaW5nPilbXCJAZGVub2Zsb3dLZXlcIl07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY3R4LnB1YmxpYy5pdGVtS2V5ID0gdW5kZWZpbmVkO1xuICAgICAgICAgIHdvcmtmbG93UmVwb3J0ZXIud2FybmluZyhcbiAgICAgICAgICAgIGBDYW4gbm90IGZvdW5kIGludGVybmFsIGl0ZW0ga2V5IFxcYEBkZW5vZmxvd0tleVxcYCwgbWF5YmUgeW91IGNoYW5nZWQgdGhlIGl0ZW0gZm9ybWF0LiBNaXNzaW5nIHRoaXMga2V5LCBkZW5vZmxvdyBjYW4gbm90IHN0b3JlIHRoZSB1bmlxdWUga2V5IHN0YXRlLiBGaXggdGhpcywgVHJ5IG5vdCBjaGFuZ2UgdGhlIHJlZmVyZW5jZSBpdGVtLCBvbmx5IGNoYW5nZSB0aGUgcHJvcGVydHkgeW91IG5lZWQgdG8gY2hhbmdlLiBUcnkgdG8gbWFudWFsIGFkZGluZyBhIFxcYEBkZW5vZmxvd0tleVxcYCBhcyBpdGVtIHVuaXF1ZSBrZXkuYCxcbiAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKFxuICAgICAgICAgIChjdHgucHVibGljLml0ZW0gYXMgUmVjb3JkPHN0cmluZywgbnVtYmVyPikgJiZcbiAgICAgICAgICAoKChjdHgucHVibGljLml0ZW0gYXMgUmVjb3JkPHN0cmluZywgbnVtYmVyPilbXG4gICAgICAgICAgICAgIFwiQGRlbm9mbG93U291cmNlSW5kZXhcIlxuICAgICAgICAgICAgXSkgYXMgbnVtYmVyKSA+PSAwXG4gICAgICAgICkge1xuICAgICAgICAgIGN0eC5wdWJsaWMuaXRlbVNvdXJjZUluZGV4ID1cbiAgICAgICAgICAgICgoY3R4LnB1YmxpYy5pdGVtIGFzIFJlY29yZDxzdHJpbmcsIG51bWJlcj4pW1xuICAgICAgICAgICAgICBcIkBkZW5vZmxvd1NvdXJjZUluZGV4XCJcbiAgICAgICAgICAgIF0pIGFzIG51bWJlcjtcbiAgICAgICAgICBjdHguaXRlbVNvdXJjZU9wdGlvbnMgPVxuICAgICAgICAgICAgY3R4LnNvdXJjZXNPcHRpb25zW2N0eC5wdWJsaWMuaXRlbVNvdXJjZUluZGV4XTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjdHguaXRlbVNvdXJjZU9wdGlvbnMgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgd29ya2Zsb3dSZXBvcnRlci53YXJuaW5nKFxuICAgICAgICAgICAgYENhbiBub3QgZm91bmQgaW50ZXJuYWwgaXRlbSBrZXkgXFxgQGRlbm9mbG93U291cmNlSW5kZXhcXGAsIG1heWJlIHlvdSBjaGFuZ2VkIHRoZSBpdGVtIGZvcm1hdC4gVHJ5IG5vdCBjaGFuZ2UgdGhlIHJlZmVyZW5jZSBpdGVtLCBvbmx5IGNoYW5nZSB0aGUgcHJvcGVydHkgeW91IG5lZWQgdG8gY2hhbmdlLiBUcnkgdG8gbWFudWFsIGFkZGluZyBhIFxcYEBkZW5vZmxvd0tleVxcYCBhcyBpdGVtIHVuaXF1ZSBrZXkuYCxcbiAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgaXRlbVJlcG9ydGVyID0gZ2V0UmVwb3J0ZXIoXG4gICAgICAgICAgYCR7Y3R4LnB1YmxpYy53b3JrZmxvd1JlbGF0aXZlUGF0aH0gLT4gaXRlbToke2luZGV4fWAsXG4gICAgICAgICAgaXNEZWJ1ZyxcbiAgICAgICAgKTtcbiAgICAgICAgaWYgKGN0eC5wdWJsaWMub3B0aW9ucz8uZGVidWcpIHtcbiAgICAgICAgICBpdGVtUmVwb3J0ZXIubGV2ZWwgPSBsb2cuTG9nTGV2ZWxzLkRFQlVHO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgXG4gICAgICAgIGlmKCF3b3JrZmxvdy5zdGVwcyl7XG4gICAgICAgICAgd29ya2Zsb3cuc3RlcHMgPSBbXTtcbiAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICBpdGVtUmVwb3J0ZXIuaW5mbyhcbiAgICAgICAgICBgU3RhcnQgdG8gaGFuZGxlIHRoaXMgaXRlbWAsXG4gICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHdvcmtmbG93LnN0ZXBzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgXG4gICAgICAgICAgY29uc3Qgc3RlcCA9IHdvcmtmbG93LnN0ZXBzW2pdO1xuICAgICAgICAgIGN0eC5wdWJsaWMuc3RlcEluZGV4ID0gajtcbiAgICAgICAgICBjb25zdCBzdGVwUmVwb3J0ZXIgPSBnZXRSZXBvcnRlcihcbiAgICAgICAgICAgIGAke2N0eC5wdWJsaWMud29ya2Zsb3dSZWxhdGl2ZVBhdGh9IC0+IHN0ZXA6JHtjdHgucHVibGljLnN0ZXBJbmRleH1gLFxuICAgICAgICAgICAgaXNEZWJ1ZyxcbiAgICAgICAgICApO1xuICAgICAgICAgIGxldCBzdGVwT3B0aW9ucyA9IHsgLi4uc3RlcCB9O1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBwYXJzZSBlbnYgZmlyc3RcbiAgICAgICAgICAgIHN0ZXBPcHRpb25zID0gYXdhaXQgcGFyc2VPYmplY3Qoc3RlcE9wdGlvbnMsIGN0eCwge1xuICAgICAgICAgICAgICBrZXlzOiBbXCJlbnZcIl0sXG4gICAgICAgICAgICB9KSBhcyBTdGVwT3B0aW9ucztcblxuICAgICAgICAgICAgLy8gcGFyc2UgaWYgb25seVxuICAgICAgICAgICAgc3RlcE9wdGlvbnMgPSBhd2FpdCBwYXJzZU9iamVjdChzdGVwT3B0aW9ucywgY3R4LCB7XG4gICAgICAgICAgICAgIGtleXM6IFtcImlmXCIsIFwiZGVidWdcIl0sXG4gICAgICAgICAgICB9KSBhcyBTdGVwT3B0aW9ucztcbiAgICAgICAgICAgIGlmIChzdGVwT3B0aW9ucy5kZWJ1ZyB8fCBjdHgucHVibGljLm9wdGlvbnM/LmRlYnVnKSB7XG4gICAgICAgICAgICAgIHN0ZXBSZXBvcnRlci5sZXZlbCA9IGxvZy5Mb2dMZXZlbHMuREVCVUc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoc3RlcE9wdGlvbnMuaWYgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgIHN0ZXBSZXBvcnRlci5pbmZvKFxuICAgICAgICAgICAgICAgIGBTa2lwIHRoaXMgc3RlcCBiZWNhdXNlIGlmIGNvbmRpdGlvbiBpcyBmYWxzZWAsXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gcGFyc2Ugb25cbiAgICAgICAgICAgIC8vIGluc2VydCBzdGVwIGVudlxuICAgICAgICAgICAgc3RlcE9wdGlvbnMgPSBhd2FpdCBwYXJzZU9iamVjdChzdGVwT3B0aW9ucywge1xuICAgICAgICAgICAgICAuLi5jdHgsXG4gICAgICAgICAgICAgIHB1YmxpYzoge1xuICAgICAgICAgICAgICAgIC4uLmN0eC5wdWJsaWMsXG4gICAgICAgICAgICAgICAgZW52OiB7XG4gICAgICAgICAgICAgICAgICAuLi5jdHgucHVibGljLmVudixcbiAgICAgICAgICAgICAgICAgIC4uLnN0ZXBPcHRpb25zLmVudixcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSkgYXMgU3RlcE9wdGlvbnM7XG4gICAgICAgICAgICAvLyBnZXQgb3B0aW9uc1xuICAgICAgICAgICAgc3RlcE9wdGlvbnMgPSBnZXRGaW5hbFNvdXJjZU9wdGlvbnMoXG4gICAgICAgICAgICAgIHdvcmtmbG93T3B0aW9ucyxcbiAgICAgICAgICAgICAgY2xpV29ya2Zsb3dPcHRpb25zLFxuICAgICAgICAgICAgICBzdGVwT3B0aW9ucyxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBpc0RlYnVnID0gc3RlcE9wdGlvbnMuZGVidWcgfHwgZmFsc2U7XG5cbiAgICAgICAgICAgIHN0ZXBSZXBvcnRlci5kZWJ1ZyhcbiAgICAgICAgICAgICAgYFN0YXJ0IHJ1biB0aGlzIHN0ZXAuYCxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZygnY3R4MicsY3R4KTtcblxuICAgICAgICAgICAgY3R4ID0gYXdhaXQgcnVuU3RlcChjdHgsIHtcbiAgICAgICAgICAgICAgLi4uc3RlcE9wdGlvbnMsXG4gICAgICAgICAgICAgIHJlcG9ydGVyOiBzdGVwUmVwb3J0ZXIsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmIChzdGVwT3B0aW9ucy5jbWQpIHtcbiAgICAgICAgICAgICAgY29uc3QgY21kUmVzdWx0ID0gYXdhaXQgcnVuQ21kKGN0eCwgc3RlcE9wdGlvbnMuY21kKTtcbiAgICAgICAgICAgICAgY3R4ID0gc2V0Q21kT2tSZXN1bHQoY3R4LCBjbWRSZXN1bHQuc3Rkb3V0KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY3R4LnB1YmxpYy5zdGVwc1tqXSA9IGdldFN0ZXBSZXNwb25zZShjdHgpO1xuICAgICAgICAgICAgaWYgKHN0ZXAuaWQpIHtcbiAgICAgICAgICAgICAgY3R4LnB1YmxpYy5zdGVwc1tzdGVwLmlkXSA9IGN0eC5wdWJsaWMuc3RlcHNbal07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHN0ZXBSZXBvcnRlci5kZWJ1ZyhcbiAgICAgICAgICAgICAgYEZpbmlzaCB0byBydW4gdGhpcyBzdGVwLmAsXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGN0eC5wdWJsaWMuc3RlcHNbal0gPSBnZXRTdGVwUmVzcG9uc2UoY3R4KTtcblxuICAgICAgICAgICAgaWYgKHN0ZXAuaWQpIHtcbiAgICAgICAgICAgICAgY3R4LnB1YmxpYy5zdGVwc1tzdGVwLmlkXSA9IGN0eC5wdWJsaWMuc3RlcHNbal07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoc3RlcC5jb250aW51ZU9uRXJyb3IpIHtcbiAgICAgICAgICAgICAgY3R4LnB1YmxpYy5vayA9IHRydWU7XG4gICAgICAgICAgICAgIHN0ZXBSZXBvcnRlci53YXJuaW5nKFxuICAgICAgICAgICAgICAgIGBGYWlsZWQgdG8gcnVuIHN0ZXBgLFxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICBzdGVwUmVwb3J0ZXIud2FybmluZyhlKTtcbiAgICAgICAgICAgICAgc3RlcFJlcG9ydGVyLndhcm5pbmcoXG4gICAgICAgICAgICAgICAgYElnbm9yZSB0aGlzIGVycm9yLCBiZWNhdXNlIGNvbnRpbnVlT25FcnJvciBpcyB0cnVlLmAsXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgc3RlcFJlcG9ydGVyLmVycm9yKFxuICAgICAgICAgICAgICAgIGBGYWlsZWQgdG8gcnVuIHN0ZXBgLFxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICAvLyB0aGlzIGl0ZW0gc3RlcHMgYWxsIG9rLCBhZGQgdW5pcXVlIGtleXMgdG8gdGhlIGludGVybmFsIHN0YXRlXG5cbiAgICAgICBcbiAgICAgICAgICAvLyBydW4gYXNzZXJ0XG4gICAgICAgICAgaWYgKHN0ZXBPcHRpb25zLmFzc2VydCkge1xuICAgICAgICAgICAgYXdhaXQgcnVuQXNzZXJ0KGN0eCwge1xuICAgICAgICAgICAgICByZXBvcnRlcjogc3RlcFJlcG9ydGVyLFxuICAgICAgICAgICAgICAuLi5zdGVwT3B0aW9ucyxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChzdGVwT3B0aW9ucy5wb3N0KSB7XG4gICAgICAgICAgICBhd2FpdCBydW5Qb3N0KGN0eCwge1xuICAgICAgICAgICAgICByZXBvcnRlcjogc3RlcFJlcG9ydGVyLFxuICAgICAgICAgICAgICAuLi5zdGVwT3B0aW9ucyxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBjaGVjayBpcyBuZWVkIHNsZWVwXG4gICAgICAgICAgaWYgKHN0ZXBPcHRpb25zLnNsZWVwICYmIHN0ZXBPcHRpb25zLnNsZWVwID4gMCkge1xuICAgICAgICAgICAgc3RlcFJlcG9ydGVyLmluZm8oXG4gICAgICAgICAgICAgIGBTbGVlcCAke3N0ZXBPcHRpb25zLnNsZWVwfSBzZWNvbmRzYCxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBhd2FpdCBkZWxheShzdGVwT3B0aW9ucy5zbGVlcCAqIDEwMDApO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAgIC8vIGNoZWNrIGlzICFmb3JjZVxuICAgICAgICAvLyBnZXQgaXRlbSBzb3VyY2Ugb3B0aW9uc1xuICAgICAgICBpZiAoY3R4Lml0ZW1Tb3VyY2VPcHRpb25zICYmICFjdHguaXRlbVNvdXJjZU9wdGlvbnMuZm9yY2UpIHtcbiAgICAgICAgICBpZiAoIWN0eC5pbnRlcm5hbFN0YXRlIHx8ICFjdHguaW50ZXJuYWxTdGF0ZS5rZXlzKSB7XG4gICAgICAgICAgICBjdHguaW50ZXJuYWxTdGF0ZSEua2V5cyA9IFtdO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoXG4gICAgICAgICAgICBjdHgucHVibGljLml0ZW1LZXkgJiZcbiAgICAgICAgICAgICFjdHguaW50ZXJuYWxTdGF0ZSEua2V5cy5pbmNsdWRlcyhjdHgucHVibGljLml0ZW1LZXkhKVxuICAgICAgICAgICkge1xuICAgICAgICAgICAgY3R4LmludGVybmFsU3RhdGUhLmtleXMudW5zaGlmdChjdHgucHVibGljLml0ZW1LZXkhKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gb25seSBzYXZlIDEwMDAgaXRlbXMgZm9yIHNhdmUgbWVtb3J5XG4gICAgICAgICAgaWYgKGN0eC5pbnRlcm5hbFN0YXRlIS5rZXlzLmxlbmd0aCA+IDEwMDApIHtcbiAgICAgICAgICAgIGN0eC5pbnRlcm5hbFN0YXRlIS5rZXlzID0gY3R4LmludGVybmFsU3RhdGUhLmtleXMuc2xpY2UoMCwxMDAwKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYod29ya2Zsb3cuc3RlcHMubGVuZ3RoPjApe1xuICAgICAgICBpdGVtUmVwb3J0ZXIuaW5mbyhcbiAgICAgICAgICBgRmluaXNoIHRvIHJ1biB3aXRoIHRoaXMgaXRlbWAsXG4gICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIC8vIHNhdmUgc3RhdGUsIGludGVybmFsU3RhdGVcbiAgICAgIC8vIGNoZWNrIGlzIGNoYW5nZWRcbiAgICAgIGNvbnN0IGN1cnJlbnRTdGF0ZSA9IEpTT04uc3RyaW5naWZ5KGN0eC5wdWJsaWMuc3RhdGUpO1xuICAgICAgLy8gYWRkIHN1Y2Nlc3MgaXRlbXMgdW5pcXVlS2V5IHRvIGludGVybmFsIFN0YXRlXG5cbiAgICAgIGNvbnN0IGN1cnJlbnRJbnRlcm5hbFN0YXRlID0gSlNPTi5zdHJpbmdpZnkoY3R4LmludGVybmFsU3RhdGUpO1xuICAgICAgaWYgKGN1cnJlbnRTdGF0ZSAhPT0gY3R4LmluaXRTdGF0ZSkge1xuICAgICAgICB3b3JrZmxvd1JlcG9ydGVyLmRlYnVnKGBTYXZlIHN0YXRlYCk7XG4gICAgICAgIGF3YWl0IGN0eC5kYiEuc2V0KFwic3RhdGVcIiwgY3R4LnB1YmxpYy5zdGF0ZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB3b3JrZmxvd1JlcG9ydGVyLmRlYnVnKGBTa2lwIHNhdmUgc2F0ZSwgY2F1c2Ugbm8gY2hhbmdlIGhhcHBlbmVkYCk7XG4gICAgICB9XG4gICAgICBpZiAoY3VycmVudEludGVybmFsU3RhdGUgIT09IGN0eC5pbml0SW50ZXJuYWxTdGF0ZSkge1xuICAgICAgICB3b3JrZmxvd1JlcG9ydGVyLmRlYnVnKFxuICAgICAgICAgIGBTYXZlIGludGVybmFsIHN0YXRlYCxcbiAgICAgICAgKTtcbiAgICAgICAgYXdhaXQgY3R4LmRiIS5zZXQoXCJpbnRlcm5hbFN0YXRlXCIsIGN0eC5pbnRlcm5hbFN0YXRlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHdvcmtmbG93UmVwb3J0ZXIuZGVidWcoXG4gICAgICAgICAgYFNraXAgc2F2ZSBpbnRlcm5hbCBzdGF0ZSwgY2F1c2Ugbm8gY2hhbmdlIGhhcHBlbmVkYCxcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIHdvcmtmbG93UmVwb3J0ZXIuaW5mbyhcbiAgICAgICAgYEZpbmlzaCB0byBydW4gdGhpcyB3b3JrZmxvd2AsXG4gICAgICApO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHdvcmtmbG93UmVwb3J0ZXIuZXJyb3IoXG4gICAgICAgIGBGYWlsZWQgdG8gcnVuIHRoaXMgd29ya2Zsb3dgLFxuICAgICAgKTtcbiAgICAgIHdvcmtmbG93UmVwb3J0ZXIuZXJyb3IoZSk7XG4gICAgICBpZiAodmFsaWRXb3JrZmxvd3MubGVuZ3RoID4gd29ya2Zsb3dJbmRleCArIDEpIHtcbiAgICAgICAgd29ya2Zsb3dSZXBvcnRlci5pbmZvKFwiU2tpcCB0byBydW4gbmV4dCB3b3JrZmxvd1wiKTtcbiAgICAgIH1cbiAgICAgIGVycm9ycy5wdXNoKHtcbiAgICAgICAgY3R4LFxuICAgICAgICBlcnJvcjplXG4gICAgICB9KTtcbiAgICB9XG4gICAgY29uc29sZS5sb2coXCJcXG5cIik7XG4gIH1cbiAgaWYgKGVycm9ycy5sZW5ndGggPiAwKSB7XG5cbiAgICBlcnJvcnMuZm9yRWFjaChlcnJvcj0+e1xuICAgICAgcmVwb3J0LmVycm9yKGBSdW4gJHtlcnJvci5jdHgucHVibGljLndvcmtmbG93UmVsYXRpdmVQYXRofSBmYWlsZWQsIGVycm9yOiAke2Vycm9yLmVycm9yfSBgKTtcbiAgICB9KVxuXG4gICAgdGhyb3cgbmV3IEVycm9yKGBGYWlsZWQgdG8gcnVuIHRoaXMgdGltZWApO1xuICB9XG59XG4iXX0=