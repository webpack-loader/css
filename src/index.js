const schema = require('./options.json')
const { getOptions } = require('@webpack-utilities/loader')
const { validateOptions } = require('@webpack-utilities/schema')

const postcss = require('postcss')

const urls = require('./plugins/url')
const imports = require('./plugins/import')

const SyntaxError = require('./Error')

const DEFAULTS = {
  url: true,
  import: true,
  sourceMap: false
}

function loader (css, map, meta) {
  const cb = this.async()
  const file = this.resourcePath

  const options = Object.assign({}, DEFAULTS, getOptions(this))

  validateOptions(schema, options, 'CSS Loader')

  if (options.sourceMap) {
    if (map && typeof map !== 'string') {
      map = JSON.stringify(map)
    }
  } else {
    map = false
  }

  const plugins = []

  // URL Plugin
  if (options.url) {
    plugins.push(urls(options))
  }

  // Import Plugin
  if (options.import) {
    plugins.push(imports(options))
  }

  if (meta) {
    const { ast } = meta

    if (ast && ast.type === 'postcss') {
      css = ast.root
    }
  }

  map = options.sourceMap
    ? {
        prev: map || false,
        inline: false,
        annotation: false,
        sourcesContent: true
      }
    : false

  return postcss(plugins)
    .process(css, {
      from: `/css-loader!${file}`,
      map,
      to: file,
    })
    .then(({ css, map, messages }) => {
      if (meta && meta.messages) {
        messages = messages.concat(meta.messages)
      }

      // CSS Imports
      let imports = messages
        .filter((msg) => (msg.type === 'import' ? msg : false))
        .reduce((imports, msg) => {
          try {
            msg = typeof msg.import === 'function'
              ? msg.import()
              : msg.import

            imports += msg
          } catch (err) {
            // TODO(michael-ciniawsky)
            // revisit (CSSImportsError)
            this.emitError(err)
          }

          return imports
        }, '')

      // CSS Exports
      let exports = messages
        .filter((msg) => (msg.type === 'export' ? msg : false))
        .reduce((exports, msg) => {
          try {
            msg = typeof msg.export === 'function'
              ? msg.export()
              : msg.export

            exports += msg
          } catch (err) {
            // TODO(michael-ciniawsky)
            // revisit (CSSExportsError)
            this.emitError(err)
          }

          return exports
        }, '')

      imports = imports ? `// CSS Imports\n${imports}\n` : false
      exports = exports ? `// CSS Exports\n${exports}\n` : false
      css = `// CSS\nexport default \`${css}\``

      const result = [imports, exports, css]
        .filter(Boolean)
        .join('\n')

      cb(null, result, map ? map.toJSON() : null)

      return null
    })
    .catch((err) => {
      err = err.name === 'CssSyntaxError'
        ? new SyntaxError(err)
        : err

      cb(err)

      return null
    })
}

module.exports = loader
