.Phony: run update test local install github source tr start build cache ask show front hackernews
run:
	DENO_DIR=./deno_dir deno run -A --unstable https://denopkg.com/denoflow/denoflow@main/cli.ts run apps/*/sources/*.yml translate.yml archive
github:
	DENO_DIR=./deno_dir deno run -A --unstable https://raw.githubusercontent.com/denoflow/denoflow/main/cli.ts run apps/*/sources/*.yml translate.yml archive
update:
	DENO_DIR=./deno_dir deno cache --reload https://denopkg.com/denoflow/denoflow@main/cli.ts
test:
	deno test -A --unstable
local:
	ENV=dev deno run --allow-read --allow-net --allow-write --allow-run --allow-env --unstable ../denoflow/cli.ts run apps/*/sources/*.yml translate.yml archive
source:
	ENV=dev deno run --allow-read --allow-net --allow-write --allow-run --allow-env --unstable ../denoflow/cli.ts run apps/*/sources/*.yml
tr:
	ENV=dev deno run --allow-read --allow-net --allow-write --allow-run --allow-env --unstable ../denoflow/cli.ts run translate.yml
install:
	PUPPETEER_PRODUCT=chrome DENO_DIR=./deno_dir deno run -A --unstable https://deno.land/x/puppeteer@9.0.2/install.ts
archive:
	ENV=dev deno run --allow-read --allow-net --allow-write --allow-run --allow-env --unstable ../denoflow/cli.ts run archive
start:
	denon start
build:
	deno run -A --unstable site/build.ts showhn
cache:
	rm -rf ./deno_dir && DENO_DIR=./deno_dir deno cache --unstable https://raw.githubusercontent.com/denoflow/denoflow/main/cli.ts && DENO_DIR=./deno_dir deno cache --unstable site/build.ts
ask:
	deno run -A --unstable site/cli.ts askhn
show:
	deno run -A --unstable site/cli.ts showhn
hackernews:
	ENV=dev deno run --allow-read --allow-net --allow-write --allow-run --allow-env --unstable ../denoflow/cli.ts run front
front:
	deno run -A --unstable site/cli.ts hackernews