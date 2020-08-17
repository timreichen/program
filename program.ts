import { Command } from "./command.ts";
import { createHelp } from "./_helpers.ts";

export class Program extends Command {
  version?: string;
  constructor(
    { name, description, version, fn = () => {} }: {
      name: string;
      description: string;
      version?: string;
      fn?: Function;
    },
  ) {
    super({ name, description, fn });
    this.version = version;
    this.commands = {};
    this.option(
      {
        name: "help",
        description: "Prints help information",
        alias: "h",
        boolean: true,
      },
    );
  }
  help() {
    const options = Object.values(this.options).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    const commands = Object.values(this.commands).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    const args = this.args.sort((a, b) => a.name.localeCompare(b.name));
    console.log(
      createHelp(
        {
          title: this.name,
          name: this.name,
          version: this.version,
          description: this.description,
          options,
          args,
          subcommands: commands,
        },
      ),
    );
  }
  parse(args: string[]) {
    if (!args.length) {
      return this.help();
    }
    super.parse(args);
  }
}
