# Bundles Filter Bundler

<!-- Shields. -->
<p>
    <!-- NPM version. -->
    <a href="https://www.npmjs.com/package/@bundles/bundles-filter"><img alt="NPM version" src="https://img.shields.io/npm/v/@bundles/bundles-filter.svg?style=flat-square"></a>
    <!-- NPM downloads/month. -->
    <a href="https://www.npmjs.com/package/@bundles/bundles-filter"><img alt="NPM downloads per month" src="https://img.shields.io/npm/dm/@bundles/bundles-filter.svg?style=flat-square"></a>
    <!-- Travis branch. -->
    <a href="https://github.com/brikcss/bundles-filter/tree/master"><img alt="Travis branch" src="https://img.shields.io/travis/rust-lang/rust/master.svg?style=flat-square&label=master"></a>
    <!-- Codacy. -->
    <a href="https://www.codacy.com/app/thezimmee/bundles-filter"><img alt="Codacy code grade" src="https://img.shields.io/codacy/grade/894fa451daf842ea98aac96393484360/master.svg?style=flat-square"></a>
    <a href="https://www.codacy.com/app/thezimmee/bundles-filter"><img alt="Codacy coverage" src="https://img.shields.io/codacy/coverage/894fa451daf842ea98aac96393484360/master.svg?style=flat-square"></a>
    <!-- Coveralls -->
    <a href='https://coveralls.io/github/brikcss/bundles-filter?branch=master'><img src='https://img.shields.io/coveralls/github/brikcss/bundles-filter/master.svg?style=flat-square' alt='Coverage Status' /></a>
    <!-- JS Standard style. -->
    <a href="https://standardjs.com"><img alt="JavaScript Style Guide" src="https://img.shields.io/badge/code_style-standard-brightgreen.svg?style=flat-square"></a>
    <!-- Prettier code style. -->
    <a href="https://prettier.io/"><img alt="code style: prettier" src="https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square"></a>
    <!-- Semantic release. -->
    <a href="https://github.com/semantic-release/semantic-release"><img alt="semantic release" src="https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg?style=flat-square"></a>
    <!-- Commitizen friendly. -->
    <a href="http://commitizen.github.io/cz-cli/"><img alt="Commitizen friendly" src="https://img.shields.io/badge/commitizen-friendly-brightgreen.svg?style=flat-square"></a>
    <!-- MIT License. -->
    <a href="https://choosealicense.com/licenses/mit/"><img alt="License" src="https://img.shields.io/npm/l/express.svg?style=flat-square"></a>
    <!-- Greenkeeper. -->
    <a href="https://greenkeeper.io/"><img src="https://badges.greenkeeper.io/brikcss/bundles-filter.svg?style=flat-square" alt="Greenkeeper badge"></a>
</p>

This is a bundler plugin for use with [Bundles](https://github.com/brikcss/bundles-core) which filters files for use with other bundlers.

## Environment support

| Node | CLI | ES Module | Browser | UMD |
| :--: | :-: | :-------: | :-----: | :-: |
|  ✓   |  ✓  |     x     |    x    |  x  |

## Install

Make sure [Bundles is installed](https://github.com/brikcss/bundles-core#install).

```sh
npm install @bundles/bundles-filter -D
```

## Usage

See [configuring Bundles](https://github.com/brikcss/bundles-core#configuration) for details on configuring Bundles and bundlers.

### `filters`

`filters` is the only configuration option. It allows you to create one or more `filter`s, each which do one of the following:

1. _Permanently_ remove specified output files from `bundle.output`.
2. Run a series of bundlers on a _temporarily_ filtered subset of output files from `bundle.output`. _NOTE: This does not remove anything from `bundle.output`, the filter only applies temporarily while the configured bundlers run._

### `filter`

**Properties:**

- `pattern` **{String|String[]|Function}** _(required)_ Use glob pattern(s) to test against each input source path. If the path matches, it will be included in the filter. Or you may pass a custom Function for more flexibility. Custom functions receive `file`, `bundle`, and `micromatch` as parameters, and must return a Boolean to tell Bundles if a file should be added to the filter. For example:
  ```js
  function myCustomFilter(file, { bundle, micromatch: mm }) {
    // Return `true` to add to filter.
    return true;
  }
  ```
- `type` **{string}** _Default: `'some'`_ [micromatch](https://github.com/micromatch/micromatch) is used to test filter patterns. By default, the `micromatch.some()` method is used to test. You may tweak the behavior to your liking by passing `'every'`, `'any'`, `'all'`, `'not'`, or `'contains'` to use the corresponding micromatch method.
- `options` **{Object}** Options passed directly to [micromatch](https://github.com/micromatch/micromatch).
- `reverse` **{Boolean}** When true, files that do NOT match `filter.pattern` will be added to the filter.
- `bundlers` **{Object[]}** When this property exists, files that match the filter will be run through these bundlers. This is useful to run certain bundlers only on a subset of a larger grouping of files. The `bundlers` property can be configured exactly like bundlers in `bundle.bundlers`. See [configuring Bundles](https://github.com/brikcss/bundles-core#configuration) for more details.

### Example:

```js
bundlers: [
  {
    run: require('@bundles/bundles-filter'),
    filters: [
      {
        // These files will be removed permanently.
        pattern: ['!*.yaml'],
      },
      {
        // All other filters will run their matching subset of files through
        // the configured bundlers, after which the original `bundle.output`
        // (minus the removed files) is restored.
        pattern: ['{one,two,three}.md'],
        bundlers: [markdown, footer],
      },
      {
        pattern: ['*.css'],
        bundlers: [css],
      },
      {
        pattern: ['*.{css,js}', '!three.js'],
        bundlers: [banner, footer],
      },
      {
        pattern: ['*.json'],
        bundlers: [json],
      },
    ],
  },
];
```
