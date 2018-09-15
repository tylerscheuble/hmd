const fs = require('fs')
const path = require('path')

const file = require('file')
const watch = require('node-watch')
const hasha = require('hasha')

const { log, warn, error } = require('./logging')
const transpile = require('./processing')

const scriptsDir = path.resolve(process.cwd(), 'scripts')

const hackmudDir = process.env.HACKMUD_DIR ||
  path.resolve(process.env.HOME, '.config/hackmud')

// check for scripts directory
try {
  const stats = fs.statSync(scriptsDir)
  if (!stats.isDirectory()) {
    error(`${path.resolve(process.cwd(), 'scripts')} is not a directory`)
  }
} catch (e) {
  // only handle missing files
  if (e.errno !== -2) {
    throw e
  }

  log(`Creating directory at ${scriptsDir}`)
  fs.mkdirSync(scriptsDir)
}

// load lock file
const lockPath = path.resolve(process.cwd(), '.hmd.lock')
let lock
try {
  lock = JSON.parse(fs.readFileSync(lockPath))
} catch (e) {
  // only handle missing files
  if (e.errno !== -2) {
    throw e
  }

  lock = {}
  log(`Creating lock file at ${lockPath}`)
  fs.writeFileSync(lockPath, '{}')
}

// walk over scripts directory
file.walkSync(scriptsDir, (dir, subdirs, files) => {
  files.forEach(f => {
    if (f.match(/\.js$/)) {
      handle(path.join(dir, f))
    }
  })
})

log(`Watching for changes in ${scriptsDir}`)
watch('./scripts', {
  recursive: true,
  filter: /\.js$/
}, (event, file) => {
  if (event !== 'update') {
    return
  }

  handle(path.resolve(file))
})

function handle(absPath) {
  const scriptsRelPath = path.relative(scriptsDir, absPath)

  // parse script name
  const splitScriptPath = scriptsRelPath.split(path.sep)
  if (splitScriptPath.length !== 2) {
    warn(`Script ${absPath} is in an invalid location. ` +
      'Scripts should be located in "scripts/<user>/<script>.js".')
    return
  }

  const [ user, scriptFile ] = splitScriptPath
  const script = scriptFile.slice(0, -3) // strip .js extension
  const scriptPath = `${user}.${script}`

  const data = fs.readFileSync(absPath, 'utf8')

  // compute md5
  const md5 = hasha(data, { algorithm: 'md5' })

  if (lock[scriptPath] && md5 === lock[scriptPath].md5) {
    return // no change
  }

  lock[scriptPath] = { md5 }

  log(`Processing file ${scriptsRelPath}`)
  const processedData = transpile(data)

  // verify that user folder exists
  const outDir = path.resolve(hackmudDir, user)
  try {
    fs.mkdirSync(outDir)
  } catch (ignored) {
    // pass
  }

  // write to file
  const outPath = path.resolve(outDir, scriptFile)
  fs.writeFileSync(outPath, processedData)

  log(`Wrote ${processedData.length} characters to ${outPath}`)

  // write to lock file
  fs.writeFileSync(lockPath, JSON.stringify(lock))
}

