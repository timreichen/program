import { parse } from "https://deno.land/std@0.65.0/flags/mod.ts"
import { createHelp, createError, invalidArgumentError, invalidSubcommandError } from "./_helpers.ts"

interface Option {
  name: string
  description: string
  boolean: boolean
  alias?: string
  args?: Argument[]
}

interface Argument {
  name: string
  optional?: boolean
  multiple?: boolean
}

class Command {
  name: string
  description: string
  options: { [name: string]: Option }
  args: Argument[]
  fn: Function
  program?: Program

  constructor({ name, description, fn = () => { }, program }: { program?: Program, name: string, description: string, fn: Function }) {
    this.program = program
    this.name = name
    this.description = description
    this.fn = fn
    this.options = {}
    this.args = []
  }
  argument({ name, optional = false, multiple = false }: { name: string, optional?: boolean, multiple?: boolean }) {
    this.args.push({ name, optional, multiple })
    return this
  }
  option({ name, description, alias, args = [], boolean = false }: { name: string, description: string, args?: Argument[], alias?: string, boolean?: boolean }) {
    this.options[name] = { name, description, alias, args, boolean }
    return this
  }
  help() {
    const options = Object.values(this.options).sort((a, b) => a.name.localeCompare(b.name))
    const args = Object.values(this.args).sort((a, b) => a.name.localeCompare(b.name))
    console.log(createHelp({ title: this.program ? `${this.name}-${this.program.name}` : "", usageName: this.program ? `${this.name} ${this.program.name}` : "", name: this.name, description: this.description, options, args, }))
  }
  parse(args: string[]) {
    const options = Object.values(this.options)
    const argParsingOptions = {
      boolean: options.filter((option) => option.boolean).map((option) => option.name),
      alias: options.reduce((object, option) => {
        if (option.alias) object[option.name] = option.alias
        return object
      }, {} as { [name: string]: string }),
    }
    const parsedArgs = parse(args, argParsingOptions)
    const { _, help, ...ops } = parsedArgs
    if (help) { return this.help() }
    const requiredArgs = this.args.filter(arg => !arg.optional)
    const length = _.length
    for (const key of Object.keys(ops)) {
      if (!this.options[key] && !Object.values(this.options).find(option => option.alias === key)) {
        return console.log(invalidArgumentError(`--${key}`))
      }
    }

    if (length < requiredArgs.length) {
      const options = Object.values(this.options)
      const args = this.args
      const requiredArguments = requiredArgs.slice(length)
      console.log(createError({ name: this.name, requiredArguments, args, options }))
      return
    }
    return this.fn(parsedArgs)
  }
}

export class Program extends Command {
  version?: string
  commands: { [name: string]: Command }
  constructor({ name, description, version, fn = () => { } }: { name: string, description: string, version?: string, fn?: Function }) {
    super({ name, description, fn })
    this.version = version
    this.commands = {}
    this.option({ name: "help", description: "Prints help information", alias: "h", boolean: true })
  }
  command({ name, description, fn = (args: any) => { } }: { name: string, description: string, fn: Function }) {
    const command = new Command({ program: this, name, description, fn })
    this.commands[name] = command
    return command
  }
  help() {
    const options = Object.values(this.options).sort((a, b) => a.name.localeCompare(b.name))
    const commands = Object.values(this.commands).sort((a, b) => a.name.localeCompare(b.name))
    const args = this.args.sort((a, b) => a.name.localeCompare(b.name))
    console.log(createHelp({ title: this.name, name: this.name, version: this.version, description: this.description, options, args, subcommands: (commands as any) }))
  }
  parse(args: string[]) {
    // make args mutable
    args = [...args]
    if (!this.commands.length) {
      if (!args.length) { return this.help() }
    }
    const cmd = args.shift() as string
    const command = this.commands[cmd]
    if (!command) {
      return console.log(invalidSubcommandError(cmd, Object.keys(this.commands)))
    }
    return command.parse(args)
  }
}