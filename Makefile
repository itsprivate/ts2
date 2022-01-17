.Phony: run update test local install github source tr
run:
	deno run --allow-read --allow-net --allow-write --allow-env --allow-run --unstable https://denopkg.com/denoflow/denoflow@main/cli.ts run apps/*/sources/*.yml translate.yml
github:
	deno run --allow-read --allow-net --allow-write --allow-env --allow-run --unstable https://raw.githubusercontent.com/denoflow/denoflow/main/cli.ts run apps/*/sources/*.yml translate.yml
update:
	deno cache --reload https://denopkg.com/denoflow/denoflow@main/cli.ts
test:
	deno test -A
local:
	deno run --allow-read --allow-net --allow-write --allow-run --allow-env --unstable ../denoflow/cli.ts run apps/*/sources/*.yml translate.yml
source:
	deno run --allow-read --allow-net --allow-write --allow-run --allow-env --unstable ../denoflow/cli.ts run apps/*/sources/*.yml
tr:
	deno run --allow-read --allow-net --allow-write --allow-run --allow-env --unstable ../denoflow/cli.ts run translate.yml
install:
	PUPPETEER_PRODUCT=chrome deno run -A --unstable https://deno.land/x/puppeteer@9.0.2/install.ts
