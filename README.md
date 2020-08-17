# Program

Simple command-line interface for deno programs.

## Usage
```ts
// cli.ts
import { Program } from "https://deno.land/x/program/mod.ts"

function log(args: any) {
  if (args.quiet) { return }
  console.log(args)
}

const program = new Program({ name: "logger", description: "program that logs", version: "1.0.1" })

program
  .command({ name: "log", description: "logs parsed arguments", fn: log })
  .option({ name: "quiet", alias: "q", description: "Suppress diagnostic output" })
  .argument({ name: "source_file", multiple: true, optional: true })

program.parse(Deno.args)

```
```sh
deno run cli.ts log hello world
```
Output:
```sh
{ _: [ "hello", "world" ] }
```

## Help
Program generates help for program and subcommands automatically.

### Program

```sh
deno run cli.ts --help
```
Output:
```sh
logger 1.0.1
program that logs

USAGE:
    logger [OPTIONS] [SUBCOMMAND]

OPTIONS:
    -h, --help    Prints help information

SUBCOMMANDS:
    log           logs parsed arguments  
```

### Subcommand
```sh
deno run test.ts log --help
```
Output:
```sh
log-logger
logs parsed arguments

USAGE:
    log logger [OPTIONS] [source_file]...

OPTIONS:
    -q, --quiet    Suppress diagnostic output

ARGS:
    [source_file]...   
```


