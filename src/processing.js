const acorn = require('acorn')
const walk = require('acorn/dist/walk')
const { minify } = require('terser')

const { warn, error } = require('./logging')

const hackmudGlobals = {
  '$db': '#db',
  '$fs': '#fs',
  '$hs': '#hs',
  '$ms': '#ms',
  '$ls': '#ls',
  '$ns': '#ns',
  '$D': '#D',
  '$FMCL': '#FMCL',
  '$G': '#G',
  '_START': '_ST',
  '_ST': '_ST',
  '_END': '_END',
  '_TIMEOUT': '_TO',
  '_TO': '_TO',
}

function transpile(script) {
  const flags = {
    minify: false,
    mangle: false,
    autocomplete: undefined
  }

  // parse for flags
  acorn.parse(script, {
    onComment(isBlock, text) {
      if (isBlock) {
        return
      }

      const parsed = text.match(/^\s*\+(\w+)\s*(.*)$/)
      if (!parsed) {
        return
      }

      const [ , flag, contents ] = parsed
      if (flag === 'minify') {
        flags.minify = true
      } else if (flag === 'mangle') {
        flags.mangle = true
      } else if (flag === 'autocomplete') {
        flags.autocomplete = contents
      } else {
        warn(`Unknown flag: ${flag}`)
      }
    }
  })

  let code = flags.minify ? minify(script, {
    ecma: 6,
    mangle: flags.mangle && {
      reserved: Object.keys(hackmudGlobals)
    },
    output: {
      beautify: true
    }
  }).code : script

  const ast = acorn.parse(code, { locations: true })

  // validate script
  if (ast.body.length !== 1 ||
    ast.body[0].type !== 'ExpressionStatement' ||
    ast.body[0].expression.type !== 'AssignmentExpression' ||
    ast.body[0].expression.left.object.name !== 'module' ||
    ast.body[0].expression.left.property.name !== 'exports' ||
    ast.body[0].expression.right.type !== 'FunctionExpression') {

    console.log(ast.body[0].expression)

    error('A script must consist of exactly one module.exports = ' +
      'function(context, args) { ... } declaration"')
  }

  const identifiers = []
  walk.simple(ast, {
    Identifier: node => {
      if (node.name in hackmudGlobals) {
        identifiers.push(node)
      }
    }
  })

  code = identifiers
    // do substitutions in reverse order to preserve
    // remaining identifier locations
    .reverse()
    .reduce((acc, node) =>
      replaceRange(acc, node.start, node.end, hackmudGlobals[node.name]), code)

  // handle autocomplete flag if present
  if (flags.autocomplete) {
    const location = ast.body[0].expression.right.body.start + 1
    code = replaceRange(code, location, location, `//${flags.autocomplete}\n`)
  }

  // strip out module.exports assignment
  code = replaceRange(code, ast.body[0].expression.left.start,
    ast.body[0].expression.right.start, '')
  //code = code.substring(ast.body[0].expression.right.start)

  // the minifier likes a trailing semicolon, but hackmud doesn't
  if (code[code.length - 1] === ';') {
    code = code.substring(0, code.length - 1)
  }

  return code
}

function replaceRange(string, start, end, sub) {
  return string.substring(0, start) + sub + string.substring(end)
}

module.exports = transpile

