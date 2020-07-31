import { parse } from "https://deno.land/std/flags/mod.ts"
import { createHelp, createError } from "./_helpers.ts"

interface Option {
  name: string
  description: string
  boolean: boolean
  alias?: string
}

interface Argument {
  name: string
  optional: boolean
  multiple: boolean
}

class Command {
  name: string
  description: string
  options: Option[]
  args: Argument[]
  fn: Function
  program?: Program

  constructor({ name, description, fn = () => { }, program }: { program?: Program, name: string, description: string, fn: Function }) {
    this.program = program
    this.name = name
    this.description = description
    this.fn = fn
    this.options = []
    this.args = []
  }
  argument({ name, optional = false, multiple = false }: { name: string, optional?: boolean, multiple?: boolean }) {
    this.args.push({ name, optional, multiple })
    return this
  }
  option({ name, description, alias, boolean = false }: { name: string, description: string, alias?: string, boolean?: boolean }) {
    this.options.push({ name, description, alias, boolean })
    return this
  }
  help() {
    const options = Object.values(this.options).sort((a, b) => a.name.localeCompare(b.name))
    const args = Object.values(this.args).sort((a, b) => a.name.localeCompare(b.name))
    console.log(createHelp({ title: this.program ? `${this.name}-${this.program.name}` : "", usageName: this.program ? `${this.name} ${this.program.name}`: "", name: this.name, description: this.description, options, args, }))
  }
  parse(args: string[]) {
    const options = this.options
    const argParsingOptions = {
      boolean: options.filter((option) => option.boolean).map((option) => option.name),
      alias: options.reduce((object, option) => {
        if (option.alias) object[option.name] = option.alias
        return object
      }, {} as { [name: string]: string }),
    }
    const { _, help } = parse(args, argParsingOptions)
    if (help) { return this.help() }
    const requiredArgs = this.args.filter(arg => !arg.optional)
    const length = _.length
    if (length < requiredArgs.length) {
      const options = this.options
      const args = this.args
      const requiredArguments = requiredArgs.slice(length)
      console.log(createError({ name: this.name, requiredArguments, args, options }))
      return
    }
    return this.fn(args)
  }
}

export class Program extends Command {
  version?: string
  commands: { [name: string]: Command }
  constructor({ name, description, version, fn = () => { } }: { name: string, description: string, version?: string, fn: Function }) {
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
    const options = this.options.sort((a, b) => a.name.localeCompare(b.name))
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
    if (!command) { return this.help() }
    return command.parse(args)
  }
}