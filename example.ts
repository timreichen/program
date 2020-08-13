// import { Program } from "https://raw.githubusercontent.com/timreichen/program/master/mod.ts"
import { Program } from "./program.ts"

function log(args: { [option: string]: any }) {
  if (args.quiet) { return }
  console.log(args)
}

const program = new Program({ name: "logger", description: "logs parsed arguments and options", version: "1.0.1", fn: log })

program
  .command({
    name: "log",
    description: "logs parsed arguments and options",
    fn: log
  })
  .option({
    name: "quiet",
    alias: "q",
    description: "Suppress diagnostic output",
  })
  .argument({ name: "argument", multiple: true, optional: true })

program.parse(Deno.args)