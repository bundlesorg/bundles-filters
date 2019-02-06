/*! bundles-filters.js | @author brikcss <https://github.com/brikcss> | @reference <https://github.com/brikcss/bundles-filters> */

import mm from 'micromatch'
import bundles from '@bundles/core'

export default (bundle = {}, bundler = {}) => {
  // Validate that `bundler.filters` is an Object or Object[].
  if (bundler.filters instanceof Object && bundler.filters.constructor === Object) bundler.filters = [bundler.filters]
  if (!(bundler.filters instanceof Array)) {
    bundle.errors.push(new Error(`[${bundle.id}] Skipped \`bundles-filter\` bundler. \`bundler.filters\` must be an Object or Array of Objects or Arrays.`))
    return bundle
  }
  // Cache original bundlers.
  const originalBundlers = bundle.bundlers.slice(0)
  // Reduce filters to promises, iterate through each one in order, and return bundle.
  return bundler.filters.reduce((promise, filter, filterIndex) => {
    return promise.then(bundle => {
      // Normalize filter.
      if (filter instanceof Array || typeof filter === 'string' || typeof filter === 'function') filter = { pattern: filter }
      // Validate filter props.
      if (!filter.pattern) {
        bundle.errors.push(new Error(`[${bundle.id}] Skipped filter ${filterIndex}. \`filter.pattern\` must exist.`))
        return bundle
      } else if (typeof filter.pattern !== 'string' && !(filter.pattern instanceof Array) && typeof filter.pattern !== 'function') {
        bundle.errors.push(new Error(`[${bundle.id}] Skipped filter \`${filter.pattern}\`. Pattern must be a String, Array, or custom Function.`))
        return bundle
      }
      // Get filtered output.
      const filteredOutput = bundle.output.filter(file => {
        let isMatch = typeof filter.pattern === 'function'
          ? filter.pattern(file, { bundle, micromatch: mm })
          : mm[['every', 'any', 'all', 'not', 'contains', 'some'].includes(filter.type) ? filter.type : 'some'](file.source.path, filter.pattern, filter.options || {})
          // Reverse the filter if `reverse` is true.
        if (filter.reverse) isMatch = !isMatch
        // Remove files that match.
        return isMatch
      })
      // If `bundlers` exists, run them.
      if (filter.bundlers instanceof Array && filter.bundlers.length) {
        // Normalize `bundlers`.
        filter.bundlers = filter.bundlers.map((bundler, bundlerIndex) => bundles.resolveBundler(bundler))
        // Run filtered output with its bundlers.
        const originalOutput = bundle.output
        bundle.bundlers = filter.bundlers
        bundle.output = filteredOutput
        return bundles.run(bundle).then(bundle => {
          // Reset original bundle data.
          bundle.bundlers = originalBundlers
          bundle.output = originalOutput
          return bundle
        })
      // Otherwise, iterate through each output file and remove the matches.
      } else {
        bundle.output = filteredOutput
        return bundle
      }
    })
  }, Promise.resolve(bundle))
}
