import { Args, parse } from "./deps.ts";
import {
  createHelp,
  missingArgumentsError,
  invalidArgumentError,
  invalidSubcommandError,
} from "./_helpers.ts";

export interface Option {
  name: string;
  description: string;
  boolean?: boolean;
  alias?: string;
  args?: Argument[];
}

export interface Argument {
  name: string;
  description?: string;
  optional?: boolean;
  multiple?: boolean;
}

export type CommandFunction = (args: Args) => unknown;

export class Command {
  name: string;
  description: string;
  commands: { [name: string]: Command };
  options: { [name: string]: Option };
  args: Argument[];
  fn: CommandFunction;
  parent?: Command;

  constructor(
    {
      name,
      description,
      fn = () => {},
      parent,
      commands = {},
      options = {},
      args = [],
    }: {
      parent?: Command;
      name: string;
      description: string;
      fn: CommandFunction;
      commands?: { [name: string]: Command };
      options?: { [name: string]: Option };
      args?: Argument[];
    },
  ) {
    this.parent = parent;
    this.name = name;
    this.description = description;
    this.fn = fn;
    this.commands = commands;
    this.options = options;
    this.args = args;
  }
  command(
    {
      name,
      description,
      fn = (args: Args) => {},
      commands = {},
      options = {},
      args = [],
    }: {
      name: string;
      description: string;
      fn: CommandFunction;
      commands?: { [name: string]: Command };
      options?: { [name: string]: Option };
      args?: Argument[];
    },
  ) {
    const command = new Command(
      { parent: this, name, description, fn, commands, options, args },
    );
    this.commands[name] = command;
    return command;
  }
  argument(
    { name, description, optional = false, multiple = false }: Argument,
  ) {
    this.args.push({ name, description, optional, multiple });
    return this;
  }
  option(
    { name, description, alias, args = [], boolean = false }: Option,
  ) {
    this.options[name] = { name, description, alias, args, boolean };
    return this;
  }
  help() {
    const commands = Object.values(this.commands).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    const options = Object.values(this.options).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    const args = Object.values(this.args).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    console.log(
      createHelp({
        title: this.parent ? `${this.parent.name}-${this.name}` : "",
        usageName: this.parent ? `${this.parent.name} ${this.name}` : "",
        name: this.name,
        description: this.description,
        options,
        args,
        subcommands: commands,
      }),
    );
  }
  parse(args: string[]): unknown {
    const options = Object.values(this.options);
    const argParsingOptions = {
      boolean: options.filter((option) => option.boolean).map((option) =>
        option.name
      ),
      alias: options.reduce((object, option) => {
        if (option.alias) object[option.name] = option.alias;
        return object;
      }, {} as { [name: string]: string }),
    };
    const parsedArgs = parse(args, argParsingOptions);
    const { _, help, ...ops } = parsedArgs;

    if (!_.length && help) {
      return this.help();
    }

    if (Object.keys(this.commands).length) {
      args = [...args];
      const cmd = args.shift() as string;
      const command = this.commands[cmd];
      if (!command) {
        return console.log(
          invalidSubcommandError(cmd, Object.keys(this.commands)),
        );
      }

      return command.parse(args);
    }

    const requiredArgs = this.args.filter((arg) => !arg.optional);
    const length = _.length;
    for (const key of Object.keys(ops)) {
      if (
        !this.options[key] &&
        !options.find((option) => option.alias === key)
      ) {
        console.log(invalidArgumentError(`--${key}`));
        return;
      }
    }

    if (length < requiredArgs.length) {
      const args = this.args;
      const requiredArguments = requiredArgs.slice(length);
      console.log(
        missingArgumentsError(
          { name: this.name, requiredArguments, args, options },
        ),
      );
      return;
    }

    return this.fn(parsedArgs);
  }
}
