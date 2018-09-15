const chalk = require('chalk')

function log(msg) {
  console.log(chalk.green(msg))
}

function warn(msg) {
  console.log(`${chalk.gray('[')}${chalk.yellow('WARN')}${chalk.gray(']')} ` +
    msg)
}

function error(msg) {
  console.log(`${chalk.gray('[')}${chalk.red('ERR')}${chalk.gray(']')} ${msg}`)
  process.exit(1)
}

module.exports = {
  log,
  warn,
  error
}
