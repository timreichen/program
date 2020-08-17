import { Argument, Option, Command } from "./command.ts";

type Collection = string[][];

const padding = 4;

function decoreateArgument(
  { name, optional, description, multiple }: Argument,
) {
  let string = optional ? `[${name}]` : `<${name}>`;
  if (multiple) string += "...";
  return string;
}
function stringifyCollection(collection: Collection, spaces: number[]) {
  let string = "";

  for (const values of collection) {
    for (const [index, value] of values.entries()) {
      const lines = value.split(`\n`);
      string += " ".repeat(padding);
      string += lines.shift()!.padEnd(spaces[index]);
      for (const line of lines) {
        string += "\n";
        string += " ".repeat(padding * 2 + spaces[0]);
        string += line;
      }
    }
    string += "\n";
  }
  return string;
}
function stringifyPart(name: string, lines: string[]) {
  let string = "";
  string += `${name}`;
  string += `\n`;
  for (const line of lines) {
    string += `${" ".repeat(padding)}${line}`;
    string += `\n`;
  }
  return string;
}
function stringifyArguments(args: Argument[] = []) {
  return args.map((arg) => decoreateArgument(arg)).join(" ");
}
function createSpaces(...collections: Collection[]) {
  const spaces: number[] = [];
  for (const collection of collections) {
    for (const strings of collection) {
      for (const [index, string] of strings.entries()) {
        const longestLineLength = Math.max(
          ...string.split(`\n`).map((line) => line.length),
        );
        spaces[index] = Math.max(spaces[index] || 0, longestLineLength);
      }
    }
  }
  return spaces;
}
function stringifySection(
  name: string,
  collection: Collection,
  spaces?: number[],
) {
  spaces = spaces || createSpaces(collection);
  let string = "";
  string += name;
  string += `\n`;
  string += stringifyCollection(collection, spaces);
  return string;
}
function stringifyUsage(
  { name, options = [], args = [], subcommands = [] }: {
    name: string;
    options?: Option[];
    args?: Argument[];
    subcommands?: Command[];
  },
) {
  const optionsString = options.length ? "[OPTIONS]" : "";
  const subcommandsString = "[SUBCOMMAND]";
  return stringifyPart(
    "USAGE:",
    [`${name} ${optionsString} ${
      subcommands.length ? subcommandsString : stringifyArguments(args)
    }`],
  );
}

export function createHelp(
  {
    title,
    name,
    usageName,
    version,
    description,
    options = [],
    args = [],
    subcommands = [],
  }: {
    title?: string;
    usageName?: string;
    name: string;
    description: string;
    version?: string;
    options: Option[];
    args: Argument[];
    subcommands?: Command[];
  },
) {
  const subcommandsCollection = subcommands.map((
    subcommand: Command,
  ) => [subcommand.name, subcommand.description]);
  const optionsCollection = options.map((option: Option) => {
    const aliasFlag = option.alias ? `-${option.alias}, ` : " ".repeat(4);
    const flag = `--${option.name}`;
    const args = option.args
      ? option.args.map((arg: Argument) => decoreateArgument(arg)).join(" ")
      : "";
    return [`${aliasFlag}${flag}${args ? ` ${args}` : ""}`, option.description];
  });
  const argsCollection = args.map((
    arg: Argument,
  ) => [decoreateArgument(arg), arg.description || ""]) as Collection;

  const spaces = createSpaces(subcommandsCollection, optionsCollection);

  let string = "";
  string += title || name;
  string += version ? ` ${version}` : "";
  string += `\n`;
  string += description || "";
  string += `\n`;
  string += `\n`;

  string += stringifyUsage(
    { name: usageName || name, options, args, subcommands },
  );
  if (optionsCollection.length) {
    string += `\n`;
    string += stringifySection("OPTIONS:", optionsCollection, spaces);
  }
  if (subcommandsCollection.length) {
    string += `\n`;
    string += stringifySection("SUBCOMMANDS:", subcommandsCollection, spaces);
  }
  if (argsCollection.length) {
    string += `\n`;
    string += stringifySection("ARGS:", argsCollection);
  }
  return string;
}

export function createError(
  { name, requiredArguments, options, args, subcommands }: {
    name: string;
    requiredArguments: Argument[];
    options: Option[];
    args: Argument[];
    subcommands?: Command[];
  },
) {
  let string = "";
  string += "error: The following required arguments were not provided:";
  string += `\n`;
  for (const argument of requiredArguments) {
    string += `${" ".repeat(padding)}${decoreateArgument(argument)}`;
    string += `\n`;
  }
  string += `\n`;
  string += stringifyUsage({ name, options, args, subcommands });
  string += `\n`;
  string += `For more information try --help`;
  return string;
}

export function invalidSubcommandError(name: string, subcommands: string[]) {
  let string = `error: The subcommand '${name}' wasn't recognized`;
  return string;
}

export function invalidArgumentError(name: string) {
  let string =
    `error: Found argument '${name}' which wasn't expected, or isn't valid in this context`;
  return string;
}
