const kCustomPromisifiedSymbol = Symbol.for("nodejs.util.promisify.custom");
export const kCustomPromisifyArgsSymbol = Symbol.for("nodejs.util.promisify.customArgs");
class NodeInvalidArgTypeError extends TypeError {
    code = "ERR_INVALID_ARG_TYPE";
    constructor(argumentName, type, received) {
        super(`The "${argumentName}" argument must be of type ${type}. Received ${typeof received}`);
    }
}
export function promisify(original) {
    if (typeof original !== "function") {
        throw new NodeInvalidArgTypeError("original", "Function", original);
    }
    if (original[kCustomPromisifiedSymbol]) {
        const fn = original[kCustomPromisifiedSymbol];
        if (typeof fn !== "function") {
            throw new NodeInvalidArgTypeError("util.promisify.custom", "Function", fn);
        }
        return Object.defineProperty(fn, kCustomPromisifiedSymbol, {
            value: fn,
            enumerable: false,
            writable: false,
            configurable: true,
        });
    }
    const argumentNames = original[kCustomPromisifyArgsSymbol];
    function fn(...args) {
        return new Promise((resolve, reject) => {
            original.call(this, ...args, (err, ...values) => {
                if (err) {
                    return reject(err);
                }
                if (argumentNames !== undefined && values.length > 1) {
                    const obj = {};
                    for (let i = 0; i < argumentNames.length; i++) {
                        obj[argumentNames[i]] = values[i];
                    }
                    resolve(obj);
                }
                else {
                    resolve(values[0]);
                }
            });
        });
    }
    Object.setPrototypeOf(fn, Object.getPrototypeOf(original));
    Object.defineProperty(fn, kCustomPromisifiedSymbol, {
        value: fn,
        enumerable: false,
        writable: false,
        configurable: true,
    });
    return Object.defineProperties(fn, Object.getOwnPropertyDescriptors(original));
}
promisify.custom = kCustomPromisifiedSymbol;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiX3V0aWxfcHJvbWlzaWZ5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiX3V0aWxfcHJvbWlzaWZ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQTBDQSxNQUFNLHdCQUF3QixHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsOEJBQThCLENBQUMsQ0FBQztBQUc1RSxNQUFNLENBQUMsTUFBTSwwQkFBMEIsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUNsRCxrQ0FBa0MsQ0FDbkMsQ0FBQztBQUVGLE1BQU0sdUJBQXdCLFNBQVEsU0FBUztJQUN0QyxJQUFJLEdBQUcsc0JBQXNCLENBQUM7SUFDckMsWUFBWSxZQUFvQixFQUFFLElBQVksRUFBRSxRQUFpQjtRQUMvRCxLQUFLLENBQ0gsUUFBUSxZQUFZLDhCQUE4QixJQUFJLGNBQWMsT0FBTyxRQUFRLEVBQUUsQ0FDdEYsQ0FBQztJQUNKLENBQUM7Q0FDRjtBQUVELE1BQU0sVUFBVSxTQUFTLENBRXZCLFFBQWtDO0lBR2xDLElBQUksT0FBTyxRQUFRLEtBQUssVUFBVSxFQUFFO1FBQ2xDLE1BQU0sSUFBSSx1QkFBdUIsQ0FBQyxVQUFVLEVBQUUsVUFBVSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0tBQ3JFO0lBRUQsSUFBSyxRQUFnQixDQUFDLHdCQUF3QixDQUFDLEVBQUU7UUFFL0MsTUFBTSxFQUFFLEdBQUksUUFBZ0IsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO1FBQ3ZELElBQUksT0FBTyxFQUFFLEtBQUssVUFBVSxFQUFFO1lBQzVCLE1BQU0sSUFBSSx1QkFBdUIsQ0FDL0IsdUJBQXVCLEVBQ3ZCLFVBQVUsRUFDVixFQUFFLENBQ0gsQ0FBQztTQUNIO1FBQ0QsT0FBTyxNQUFNLENBQUMsY0FBYyxDQUFDLEVBQUUsRUFBRSx3QkFBd0IsRUFBRTtZQUN6RCxLQUFLLEVBQUUsRUFBRTtZQUNULFVBQVUsRUFBRSxLQUFLO1lBQ2pCLFFBQVEsRUFBRSxLQUFLO1lBQ2YsWUFBWSxFQUFFLElBQUk7U0FDbkIsQ0FBQyxDQUFDO0tBQ0o7SUFLRCxNQUFNLGFBQWEsR0FBSSxRQUFnQixDQUFDLDBCQUEwQixDQUFDLENBQUM7SUFFcEUsU0FBUyxFQUFFLENBQVksR0FBRyxJQUFlO1FBQ3ZDLE9BQU8sSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7WUFDckMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsR0FBRyxJQUFJLEVBQUUsQ0FBQyxHQUFVLEVBQUUsR0FBRyxNQUFpQixFQUFFLEVBQUU7Z0JBQ2hFLElBQUksR0FBRyxFQUFFO29CQUNQLE9BQU8sTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2lCQUNwQjtnQkFDRCxJQUFJLGFBQWEsS0FBSyxTQUFTLElBQUksTUFBTSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7b0JBQ3BELE1BQU0sR0FBRyxHQUFHLEVBQUUsQ0FBQztvQkFDZixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsYUFBYSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTt3QkFFNUMsR0FBVyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztxQkFDNUM7b0JBQ0QsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2lCQUNkO3FCQUFNO29CQUNMLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztpQkFDcEI7WUFDSCxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVELE1BQU0sQ0FBQyxjQUFjLENBQUMsRUFBRSxFQUFFLE1BQU0sQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztJQUUzRCxNQUFNLENBQUMsY0FBYyxDQUFDLEVBQUUsRUFBRSx3QkFBd0IsRUFBRTtRQUNsRCxLQUFLLEVBQUUsRUFBRTtRQUNULFVBQVUsRUFBRSxLQUFLO1FBQ2pCLFFBQVEsRUFBRSxLQUFLO1FBQ2YsWUFBWSxFQUFFLElBQUk7S0FDbkIsQ0FBQyxDQUFDO0lBQ0gsT0FBTyxNQUFNLENBQUMsZ0JBQWdCLENBQzVCLEVBQUUsRUFDRixNQUFNLENBQUMseUJBQXlCLENBQUMsUUFBUSxDQUFDLENBQzNDLENBQUM7QUFDSixDQUFDO0FBRUQsU0FBUyxDQUFDLE1BQU0sR0FBRyx3QkFBd0IsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjEgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vL1xuLy8gQWRhcHRlZCBmcm9tIE5vZGUuanMuIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG4vLyBIYWNrOiB3b3JrIGFyb3VuZCB0aGUgZm9sbG93aW5nIFR5cGVTY3JpcHQgZXJyb3I6XG4vLyAgIGVycm9yOiBUUzIzNDUgW0VSUk9SXTogQXJndW1lbnQgb2YgdHlwZSAndHlwZW9mIGtDdXN0b21Qcm9taXNpZmllZFN5bWJvbCdcbi8vICAgaXMgbm90IGFzc2lnbmFibGUgdG8gcGFyYW1ldGVyIG9mIHR5cGUgJ3R5cGVvZiBrQ3VzdG9tUHJvbWlzaWZpZWRTeW1ib2wnLlxuLy8gICAgICAgIGFzc2VydFN0cmljdEVxdWFscyhrQ3VzdG9tUHJvbWlzaWZpZWRTeW1ib2wsIHByb21pc2lmeS5jdXN0b20pO1xuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH5+fn5+fn5+fn5+fn5+fn5cbmRlY2xhcmUgY29uc3QgX0N1c3RvbVByb21pc2lmaWVkU3ltYm9sOiB1bmlxdWUgc3ltYm9sO1xuZGVjbGFyZSBjb25zdCBfQ3VzdG9tUHJvbWlzaWZ5QXJnc1N5bWJvbDogdW5pcXVlIHN5bWJvbDtcbmRlY2xhcmUgbGV0IFN5bWJvbDogU3ltYm9sQ29uc3RydWN0b3I7XG5pbnRlcmZhY2UgU3ltYm9sQ29uc3RydWN0b3Ige1xuICBmb3Ioa2V5OiBcIm5vZGVqcy51dGlsLnByb21pc2lmeS5jdXN0b21cIik6IHR5cGVvZiBfQ3VzdG9tUHJvbWlzaWZpZWRTeW1ib2w7XG4gIGZvcihcbiAgICBrZXk6IFwibm9kZWpzLnV0aWwucHJvbWlzaWZ5LmN1c3RvbUFyZ3NcIixcbiAgKTogdHlwZW9mIF9DdXN0b21Qcm9taXNpZnlBcmdzU3ltYm9sO1xufVxuLy8gRW5kIGhhY2suXG5cbi8vIEluIGFkZGl0aW9uIHRvIGJlaW5nIGFjY2Vzc2libGUgdGhyb3VnaCB1dGlsLnByb21pc2lmeS5jdXN0b20sXG4vLyB0aGlzIHN5bWJvbCBpcyByZWdpc3RlcmVkIGdsb2JhbGx5IGFuZCBjYW4gYmUgYWNjZXNzZWQgaW4gYW55IGVudmlyb25tZW50IGFzXG4vLyBTeW1ib2wuZm9yKCdub2RlanMudXRpbC5wcm9taXNpZnkuY3VzdG9tJykuXG5jb25zdCBrQ3VzdG9tUHJvbWlzaWZpZWRTeW1ib2wgPSBTeW1ib2wuZm9yKFwibm9kZWpzLnV0aWwucHJvbWlzaWZ5LmN1c3RvbVwiKTtcbi8vIFRoaXMgaXMgYW4gaW50ZXJuYWwgTm9kZSBzeW1ib2wgdXNlZCBieSBmdW5jdGlvbnMgcmV0dXJuaW5nIG11bHRpcGxlXG4vLyBhcmd1bWVudHMsIGUuZy4gWydieXRlc1JlYWQnLCAnYnVmZmVyJ10gZm9yIGZzLnJlYWQoKS5cbmV4cG9ydCBjb25zdCBrQ3VzdG9tUHJvbWlzaWZ5QXJnc1N5bWJvbCA9IFN5bWJvbC5mb3IoXG4gIFwibm9kZWpzLnV0aWwucHJvbWlzaWZ5LmN1c3RvbUFyZ3NcIixcbik7XG5cbmNsYXNzIE5vZGVJbnZhbGlkQXJnVHlwZUVycm9yIGV4dGVuZHMgVHlwZUVycm9yIHtcbiAgcHVibGljIGNvZGUgPSBcIkVSUl9JTlZBTElEX0FSR19UWVBFXCI7XG4gIGNvbnN0cnVjdG9yKGFyZ3VtZW50TmFtZTogc3RyaW5nLCB0eXBlOiBzdHJpbmcsIHJlY2VpdmVkOiB1bmtub3duKSB7XG4gICAgc3VwZXIoXG4gICAgICBgVGhlIFwiJHthcmd1bWVudE5hbWV9XCIgYXJndW1lbnQgbXVzdCBiZSBvZiB0eXBlICR7dHlwZX0uIFJlY2VpdmVkICR7dHlwZW9mIHJlY2VpdmVkfWAsXG4gICAgKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcHJvbWlzaWZ5KFxuICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICBvcmlnaW5hbDogKC4uLmFyZ3M6IGFueVtdKSA9PiB2b2lkLFxuICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuKTogKC4uLmFyZ3M6IGFueVtdKSA9PiBQcm9taXNlPGFueT4ge1xuICBpZiAodHlwZW9mIG9yaWdpbmFsICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICB0aHJvdyBuZXcgTm9kZUludmFsaWRBcmdUeXBlRXJyb3IoXCJvcmlnaW5hbFwiLCBcIkZ1bmN0aW9uXCIsIG9yaWdpbmFsKTtcbiAgfVxuICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICBpZiAoKG9yaWdpbmFsIGFzIGFueSlba0N1c3RvbVByb21pc2lmaWVkU3ltYm9sXSkge1xuICAgIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gICAgY29uc3QgZm4gPSAob3JpZ2luYWwgYXMgYW55KVtrQ3VzdG9tUHJvbWlzaWZpZWRTeW1ib2xdO1xuICAgIGlmICh0eXBlb2YgZm4gIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgdGhyb3cgbmV3IE5vZGVJbnZhbGlkQXJnVHlwZUVycm9yKFxuICAgICAgICBcInV0aWwucHJvbWlzaWZ5LmN1c3RvbVwiLFxuICAgICAgICBcIkZ1bmN0aW9uXCIsXG4gICAgICAgIGZuLFxuICAgICAgKTtcbiAgICB9XG4gICAgcmV0dXJuIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShmbiwga0N1c3RvbVByb21pc2lmaWVkU3ltYm9sLCB7XG4gICAgICB2YWx1ZTogZm4sXG4gICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICB9KTtcbiAgfVxuXG4gIC8vIE5hbWVzIHRvIGNyZWF0ZSBhbiBvYmplY3QgZnJvbSBpbiBjYXNlIHRoZSBjYWxsYmFjayByZWNlaXZlcyBtdWx0aXBsZVxuICAvLyBhcmd1bWVudHMsIGUuZy4gWydieXRlc1JlYWQnLCAnYnVmZmVyJ10gZm9yIGZzLnJlYWQuXG4gIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gIGNvbnN0IGFyZ3VtZW50TmFtZXMgPSAob3JpZ2luYWwgYXMgYW55KVtrQ3VzdG9tUHJvbWlzaWZ5QXJnc1N5bWJvbF07XG4gIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gIGZ1bmN0aW9uIGZuKHRoaXM6IGFueSwgLi4uYXJnczogdW5rbm93bltdKTogUHJvbWlzZTx1bmtub3duPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIG9yaWdpbmFsLmNhbGwodGhpcywgLi4uYXJncywgKGVycjogRXJyb3IsIC4uLnZhbHVlczogdW5rbm93bltdKSA9PiB7XG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICByZXR1cm4gcmVqZWN0KGVycik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGFyZ3VtZW50TmFtZXMgIT09IHVuZGVmaW5lZCAmJiB2YWx1ZXMubGVuZ3RoID4gMSkge1xuICAgICAgICAgIGNvbnN0IG9iaiA9IHt9O1xuICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYXJndW1lbnROYW1lcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgICAgICAgICAgIChvYmogYXMgYW55KVthcmd1bWVudE5hbWVzW2ldXSA9IHZhbHVlc1tpXTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmVzb2x2ZShvYmopO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlc29sdmUodmFsdWVzWzBdKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBPYmplY3Quc2V0UHJvdG90eXBlT2YoZm4sIE9iamVjdC5nZXRQcm90b3R5cGVPZihvcmlnaW5hbCkpO1xuXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShmbiwga0N1c3RvbVByb21pc2lmaWVkU3ltYm9sLCB7XG4gICAgdmFsdWU6IGZuLFxuICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICBjb25maWd1cmFibGU6IHRydWUsXG4gIH0pO1xuICByZXR1cm4gT2JqZWN0LmRlZmluZVByb3BlcnRpZXMoXG4gICAgZm4sXG4gICAgT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcnMob3JpZ2luYWwpLFxuICApO1xufVxuXG5wcm9taXNpZnkuY3VzdG9tID0ga0N1c3RvbVByb21pc2lmaWVkU3ltYm9sO1xuIl19