.Phony: run update
run:
	deno run --allow-read --allow-net --allow-write --allow-env --allow-run --unstable https://denopkg.com/denoflow/denoflow@main/cli.ts run
update:
	deno cache --reload https://denopkg.com/denoflow/denoflow@main/cli.ts