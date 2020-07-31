import { Program } from "https://raw.githubusercontent.com/timreichen/cli/master/mod.ts"

function log(args: { [option: string]: any }) {
  if (!args.quiet) { return }
  console.log(args)
}

const program = new Program({ name: "logger", description: "logs parsed arguments", version: "1.0.1", fn: log })

program
  .command({
    name: "log",
    description: "logs parsed arguments",
    fn: log
  })
  .option({
    name: "quiet",
    alias: "q",
    description: "Suppress diagnostic output",
  })
  .argument({ name: "source_file", multiple: true, optional: true })

program.parse(Deno.args)