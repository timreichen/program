// import { Program } from "https://raw.githubusercontent.com/timreichen/program/master/mod.ts"
import { Program } from "./program.ts";
import { invalidSubcommandError } from "./_helpers.ts";

function log(args: { [option: string]: string | number }) {
  if (args.quiet) return;
  console.log(args);
}

const program = new Program(
  {
    name: "logger",
    description: "logs parsed arguments and options",
    version: "1.0.1",
    fn: log,
  },
);

program
  .command({
    name: "log",
    description: "logs parsed arguments and options",
    fn: log,
  })
  .option({
    name: "quiet",
    alias: "q",
    description: "Suppress diagnostic output",
  })
  .argument({ name: "argument", multiple: true, optional: true });

function help(args: string[]) {
  if (!args.length) {
    return program.help();
  }
  for (const cmd of args) {
    if (!program.commands[cmd]) {
      return console.log(
        invalidSubcommandError(cmd, Object.keys(program.commands)),
      );
    }
  }
  const cmd = args[0];
  const command = program.commands[cmd];
  return command.help();
}

program
  .command(
    {
      name: "help",
      description: "Prints this message or the help of the given subcommand(s)",
      fn: help(program),
    },
  )
  .argument(
    {
      name: "subcommands",
      description: "The subcommand whose help message to display",
      optional: true,
      multiple: true,
    },
  );

program.parse(Deno.args);
