import chalk from "chalk"

const logInfo = true
const logLoaded = true
const logRendered = false
let switchRendered = true

const logChalk = console.log

class Console {
  private static instance: Console

  private constructor() {
    this.loaded("Console")
  }

  static getInstance(): Console {
    if (!Console.instance) {
      Console.instance = new Console()
    }
    return Console.instance
  }

  i = async (tag: string, func: string, log: unknown = null, forced = false) => {
    if (forced || logInfo) {
      logChalk(chalk.bgBlue.bold.cyanBright(tag + " ->" + "  " + chalk.whiteBright(func)))
      if (log != null) logChalk(log)
      // logChalk(chalk.blue("<----------------------------------------------------->"))
    }
  }

  loaded = async (service: string, forced = false) => {
    if (forced || logLoaded) {
      logChalk(chalk.bgYellowBright.bold.black(service + " Service ===> Loaded..."))
    }
  }

  loadedVersion = async (service: string, version: string, forced = false) => {
    if (forced || logLoaded) {
      logChalk(chalk.bgYellowBright.bold.black(service + " Service ===> Loaded..."))
      logChalk(chalk.cyan.bold("Version: " + version))
    }
  }

  rendered = async (component: string, forced = false) => {
    if (forced || logRendered) {
      if (switchRendered) {
        switchRendered = false
        logChalk(chalk.green.bold(component + " Component Rendered..."))
      } else {
        switchRendered = true
        logChalk(chalk.cyan.bold(component + " Component Rendered..."))
      }
    }
  }

  test = async () => {
    // Combine styled and normal strings
    logChalk(chalk.blue("Hello") + " World" + chalk.red("!"))

    // Compose multiple styles using the chainable API
    logChalk(chalk.blue.bgRed.bold("Hello world!"))

    // Pass in multiple arguments
    logChalk(chalk.blue("Hello", "World!", "Foo", "bar", "biz", "baz"))

    // Nest styles
    logChalk(chalk.red("Hello", chalk.underline.bgBlue("world") + "!"))

    // Nest styles of the same type even (color, underline, background)
    logChalk(chalk.green("I am a green line " + chalk.blue.underline.bold("with a blue substring") + " that becomes green again!"))

    // ES2015 template literal
    logChalk(`
      CPU: ${chalk.red("90%")}
      RAM: ${chalk.green("40%")}
      DISK: ${chalk.yellow("70%")}`)
    const error = chalk.bold.red
    const warning = chalk.hex("#d50789") // Orange color

    console.log(error("Error!"))
    console.log(warning("Warning!"))

    // Use RGB colors in terminal emulators that support it.
    logChalk(chalk.rgb(123, 45, 67).underline("Underlined reddish color"))
    logChalk(chalk.hex("#DEADED").bold("Bold gray!"))

    //String substitution
    const name = "Joseph"
    console.log(chalk.bold.green("Hello %s"), name)
  }
}

export const log = Console.getInstance()
