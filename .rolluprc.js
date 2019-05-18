/*! .rolluprc.js | @author brikcss <https://github.com/brikcss> | @reference <https://rollupjs.org> */

// -------------------------------------------------------------------------------------------------
// Imports and setup.
//

import babel from 'rollup-plugin-babel'
import { terser as uglify } from 'rollup-plugin-terser'
import pkg from './package.json'

// Flags.
const isProd = ['production', 'test'].includes(process.env.NODE_ENV)

// Set base options.
const base = {
  input: 'src/bundles-filters.js',
  external: [...Object.keys(pkg.dependencies)],
  watch: {
    chokidar: true,
    include: 'src/**',
    exclude: 'node_modules/**',
    clearScreen: true
  }
}

// -------------------------------------------------------------------------------------------------
// Configs.
//

let configs = {
  output: [
    // Node / CommonJS module.
    {
      file: pkg.main,
      format: 'cjs'
    // ES module.
    }, {
      file: pkg.module,
      format: 'es'
    }
  ],
  plugins: [
    babel({
      exclude: ['node_modules/**'],
      presets: [['@babel/preset-env', {
        targets: {
          node: '8'
        }
      }]]
    }),
    isProd && uglify()
  ]
}

// -------------------------------------------------------------------------------------------------
// Exports.
//

export default Object.assign({}, base, configs)
