import { Program } from "./program.ts";
import { invalidSubcommandError } from "./_helpers.ts";
import type { Args } from "./deps.ts";

function log(args: { [option: string]: Args }) {
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

function help(args: { [option: string]: string[] | string | number }) {
  const { _ } = args;
  if (!Object.keys(_).length) {
    return program.help();
  }
  const cmd = (_ as string[])[0];
  const command = program.commands[cmd];
  if (!command) {
    return console.log(
      invalidSubcommandError(cmd, Object.keys(program.commands)),
    );
  }
  return command.help();
}

program
  .command(
    {
      name: "help",
      description: "Prints this message or the help of the given subcommand(s)",
      fn: help,
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
