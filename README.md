# hmd-cli

`hmd` is a command line transpiler for managing and deploying hackmud scripts.
`hmd` can also minify and mangle your scripts with
[terser](https://github.com/fabiosantoscode/terser), allowing you to save script
space with no compromises in readability. Scripts written for `hmd` can also
be loaded as CommonJS modules, making unit testing possible.

## Getting started

Install with yarn:

```shell
yarn global add hmd-cli
```

or with npm:

```shell
npm install -g hmd-cli
```

To use `hmd` simply navigate to your working directory and run:

```shell
hmd
```

## Code structure

In order for `hmd` to transpile your scripts into a format hackmud is
comfortable with, there are a few simple rules that your script files
must follow:

1. Scripts must contain exactly one top-level declaration (top-level
comments are OK).
2. The top-level declaration must assign `module.exports` to your function.
3. Like a vanilla hackmud script, all code must lie inside the exported
function.

To help with understanding these rules, here is an example EZ\_21 cracker:

```javascript
//+autocomplete target:#s.some.npc

module.exports = function(context, args) {
  const options = [ 'open', 'release', 'unlock' ]
  while (true) {
    if (options.length === 0) {
      return { ok: false }
    }

    const result = args.target.call({ ez_21: options.shift() })
    if (!result.includes('is not the correct')) {
      return { ok: true }
    }
  }
}
```

The first line is an example of a [script flag](#script-flags).

## Differences from vanilla hackmud scripts

Unlike vanilla hackmud scripts, `hmd` scripts must be valid javascript. This
means that hackmud's preprocessing directives won't work for us here. To fix
this `hmd` defines a set of global variables that transform into hackmud's
preprocessing directives:

| Preprocessing directive  | Hackmud example   | `hmd` equivalent  |
| ------------------------ | ----------------- | ----------------- |
| Fullsec Subscript        | #fs.user.script() | $fs.user.script() |
| Highsec Subscript        | #hs.user.script() | $hs.user.script() |
| Midsec Subscript         | #ms.user.script() | $ms.user.script() |
| Lowsec Subscript         | #ls.user.script() | $ls.user.script() |
| Nullsec Subscript        | #ns.user.script() | $ns.user.script() |
| Debug Log                | #D(entry)         | $D(entry)         |
| Function Multi-Call Lock | #FMCL             | $FMCL             |
| Per-script Global Object | #G                | $G                |
| Database object          | #db               | $db                |

The special script variables `_START`/`_ST`, `_END`, and `_TIMEOUT`/`_TO` are
not really preprocessing directives, and can be used like normal.

## Script flags

`hmd` can be configured on a per-script basis by adding script flags. Script
flags are defined as single-line comments with a + as the first non-whitespace
character. Script flags can be anywhere in your file, but I they are typically
located in top level above your exported function.
### +autocomplete flag

In vanilla hackmud autocomplete arguments are provided by adding a single-line
comment after your function declaration. Because comments are typically removed
when compression is enabled, `hmd` provides an alternate way to specify
autocomplete arguments through the `+autocomplete` flag. Arguments provided are
the same as vanilla hackmud. Here's an example:

```javascript
//+autocomplete arg1:val1, arg2:val2, arg3:#s.xena.defender
```

### +minify flag

Since hackmud limits the amount of characters in scripts, it can be beneficial
to minify your script files. If the `+minify` flag is in your script, `hmd`
will do this automatically with [terser](https://github.com/fabiosantoscode/terser/).

### +mangle flag

If you need more characters on top of the `+minify` flag, you can use the 
`+mangle` flag as well. If the `+mangle` flag is present, variable names
will be mangled to save space. Because this can make debugging harder in
some cases, it is off by default.

## Caveats

Currently the compression and mangling options are set by `hmd` and are not
exposed to the user. The options are configured in a way that should be
compatible with hackmud, but I cannot guarantee that all scripts will work
in all cases. I have not encountered any of these cases, but that doesn't
mean you won't.

If you find a case in which `hmd` does not work for your script, please open
an issue. Or if you really don't want your script to be made public, you are
welcome to [send me an email](mailto:tyler@scheuble.us) as an alternative.

## Testing

Although testing is theoretically possible with `hmd`, mocks would need to
be created for hackmud's preprocessor directive substitutions and special
script variables for scripts to run in a local environment. A npm package
for this is in the works.

## Donate

Like what I am doing? 

```
accts.xfer_gc_to { to: "hmd", amount:<amount> }
```

