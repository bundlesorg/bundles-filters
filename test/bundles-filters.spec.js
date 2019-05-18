/* eslint-env jest */
const log = require('loglevel')
const bundle = require('@bundles/core')
const filter = require('../lib/bundles-filters.js')
const micromatch = require('micromatch')

log.setLevel('silent')

test('permanently remove files from bundle', () => {
  expect.assertions(3)
  return bundle.run({ bundles: [{
    id: 'permanent',
    input: ['lib/**', 'test/**', '*.{md,json}'],
    bundlers: [{
      run: filter,
      filters: [['package.json']]
    }]
  }] }).then(result => {
    expect(result.success).toBe(true)
    expect(result.bundles[0].output.size).toBe(1)
    expect(result.bundles[0].output.get('package.json')).toMatchObject({
      source: {
        path: 'package.json'
      }
    })
  })
})

test('reverse filter and remove files', () => {
  expect.assertions(6)
  return bundle.run({ bundles: [{
    id: 'reverse',
    input: ['src/**', 'test/**', '*.{md,json}'],
    bundlers: [{
      run: filter,
      filters: [{ pattern: ['package.json'], reverse: true }]
    }]
  }] }).then(result => {
    const output = result.bundles[0].output
    expect(result.success).toBe(true)
    expect(output.size).toBe(4)
    expect(output.has('src/bundles-filters.js')).toBe(true)
    expect(output.has('test/bundles-filters.spec.js')).toBe(true)
    expect(output.has('README.md')).toBe(true)
    expect(output.has('package-lock.json')).toBe(true)
  })
})

test('`pattern` as custom Function', () => {
  expect.assertions(3)
  return bundle.run({ bundles: [{
    id: 'function',
    input: ['lib/**', 'test/**', '*.{md,json}'],
    bundlers: [{
      run: filter,
      filters: [(file) => micromatch.all(file.source.path, ['*.md'])]
    }]
  }] }).then(result => {
    expect(result.success).toBe(true)
    expect(result.bundles[0].output.size).toBe(1)
    expect(result.bundles[0].output.has('README.md')).toBe(true)
  })
})

test('run multiple filters with `bundlers`', () => {
  expect.assertions(18)
  return bundle.run({ bundles: [{
    id: 'tasks',
    input: [
      { path: 'one.md', content: '# Number 1\n\nI am number one.' },
      { path: 'one.css', content: 'body { display: none; }' },
      { path: 'one.js', content: 'module.export = (one) => one' },
      { path: 'two.md', content: '# Number 2\n\nI am number two.' },
      { path: 'three.md', content: '# Number 3\n\nI am number three.' },
      { path: 'one.yaml', content: 'test: 123' },
      { path: 'two.js', content: 'module.export = (two) => two' },
      { path: 'three.js', content: 'module.export = (three) => three' },
      { path: 'one.json', content: '{ "one": 1, "two": 2, "three": 3 }' }
    ],
    bundlers: [{
      run: filter,
      filters: [{
        pattern: ['!*.yaml']
      }, {
        pattern: ['{one,two,three}.md'],
        bundlers: [markdown, footer]
      }, {
        pattern: ['*.css'],
        bundlers: [css]
      }, {
        pattern: ['*.{css,js}', '!three.js'],
        bundlers: [banner, footer]
      }, {
        pattern: ['*.json'],
        bundlers: [json]
      }]
    }]
  }] }).then(result => {
    expect(result.success).toBe(true)
    const output = result.bundles[0].output
    expect(output.size).toBe(8)
    expect(output.has('one.md')).toBe(true)
    expect(output.has('one.css')).toBe(true)
    expect(output.has('one.js')).toBe(true)
    expect(output.has('two.md')).toBe(true)
    expect(output.has('three.md')).toBe(true)
    expect(output.has('two.js')).toBe(true)
    expect(output.has('three.js')).toBe(true)
    expect(output.has('one.json')).toBe(true)
    expect(output.get('one.md').content).toBe('# Number 1\n\nI am number one. Aren\'t I cool?\n\nI am a Markdown file.\n')
    expect(output.get('one.css').content).toBe('/* one.css */\n\nbody { display: none; }\n\n.my-dynamic-selector { display: block; }\n\n/* I am a CSS file. */\n')
    expect(output.get('one.js').content).toBe('/* one.js */\n\nmodule.export = (one) => one\n\n/* I am a JavaScript file. */\n')
    expect(output.get('two.md').content).toBe('# Number 2\n\nI am number two. Aren\'t I cool?\n\nI am a Markdown file.\n')
    expect(output.get('three.md').content).toBe('# Number 3\n\nI am number three. Aren\'t I cool?\n\nI am a Markdown file.\n')
    expect(output.get('two.js').content).toBe('/* two.js */\n\nmodule.export = (two) => two\n\n/* I am a JavaScript file. */\n')
    expect(output.get('three.js').content).toBe('module.export = (three) => three')
    expect(output.get('one.json').content).toBe('{"one":1,"two":2,"three":3,"four":4,"type":"json"}')
  })
})

function footer (bundle) {
  const path = require('path')
  const typeMap = {
    md: 'Markdown',
    js: 'JavaScript'
  }
  const tags = {
    css: ['/* ', ' */'],
    js: ['/* ', ' */']
  }
  bundle.output.forEach(file => {
    const ext = path.extname(file.source.path).replace('.', '')
    file.content += '\n\n' + (tags[ext] ? tags[ext][0] : '') + 'I am a ' + (typeMap[ext] ? typeMap[ext] : ext.toUpperCase()) + ' file.' + (tags[ext] ? tags[ext][1] : '') + '\n'
  })
  return bundle
}

function banner (bundle) {
  const path = require('path')
  bundle.output.forEach(file => {
    file.content = '/* ' + path.basename(file.source.path) + ' */\n\n' + file.content
  })
  return bundle
}

function markdown (bundle) {
  bundle.output.forEach(file => {
    file.content += ' Aren\'t I cool?'
  })
  return bundle
}

function css (bundle) {
  bundle.output.forEach(file => {
    file.content += '\n\n.my-dynamic-selector { display: block; }'
  })
  return bundle
}

function json (bundle) {
  bundle.output.forEach(file => {
    const json = JSON.parse(file.content)
    json.four = 4
    json.type = 'json'
    file.content = JSON.stringify(json)
  })
  return bundle
}
