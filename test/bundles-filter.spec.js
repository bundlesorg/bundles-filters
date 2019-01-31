/* eslint-env jest */
const log = require('loglevel')
const bundle = require('@bundles/core')
const filter = require('../lib/bundles-filter.js')

log.setLevel('silent')

test('permanently remove files from bundle', () => {
  expect.assertions(3)
  return bundle({ bundles: [{
    id: 'permanent',
    input: ['lib/**', 'test/**', '*.{md,json}'],
    bundlers: [{
      run: filter,
      filters: [['package.json']]
    }]
  }] }).then(result => {
    expect(result.success).toBe(true)
    expect(result.bundles[0].output.length).toBe(1)
    expect(result.bundles[0].output[0]).toMatchObject({
      source: {
        path: 'package.json'
      }
    })
  })
})

test('reverse filter and remove files', () => {
  expect.assertions(6)
  return bundle({ bundles: [{
    id: 'reverse',
    input: ['lib/**', 'test/**', '*.{md,json}'],
    bundlers: [{
      run: filter,
      filters: [{ pattern: ['package.json'], reverse: true }]
    }]
  }] }).then(result => {
    expect(result.success).toBe(true)
    expect(result.bundles[0].output.length).toBe(4)
    expect(result.bundles[0].output[0].source.path).toBe('lib/bundles-filter.js')
    expect(result.bundles[0].output[1].source.path).toBe('test/bundles-filter.spec.js')
    expect(result.bundles[0].output[2].source.path).toBe('README.md')
    expect(result.bundles[0].output[3].source.path).toBe('package-lock.json')
  })
})

test('`pattern` as custom Function', () => {
  expect.assertions(3)
  return bundle({ bundles: [{
    id: 'function',
    input: ['lib/**', 'test/**', '*.{md,json}'],
    bundlers: [{
      run: filter,
      filters: [(file, { micromatch }) => micromatch.all(file.source.path, ['*.md'])]
    }]
  }] }).then(result => {
    expect(result.success).toBe(true)
    expect(result.bundles[0].output.length).toBe(1)
    expect(result.bundles[0].output[0].source.path).toBe('README.md')
  })
})

test('run multiple filters with `bundlers`', () => {
  expect.assertions(18)
  return bundle({ bundles: [{
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
    expect(output.length).toBe(8)
    expect(output[0].source.path).toBe('one.md')
    expect(output[1].source.path).toBe('one.css')
    expect(output[2].source.path).toBe('one.js')
    expect(output[3].source.path).toBe('two.md')
    expect(output[4].source.path).toBe('three.md')
    expect(output[5].source.path).toBe('two.js')
    expect(output[6].source.path).toBe('three.js')
    expect(output[7].source.path).toBe('one.json')
    expect(output[0].content).toBe('# Number 1\n\nI am number one. Aren\'t I cool?\n\nI am a Markdown file.\n')
    expect(output[1].content).toBe('/* one.css */\n\nbody { display: none; }\n\n.my-dynamic-selector { display: block; }\n\n/* I am a CSS file. */\n')
    expect(output[2].content).toBe('/* one.js */\n\nmodule.export = (one) => one\n\n/* I am a JavaScript file. */\n')
    expect(output[3].content).toBe('# Number 2\n\nI am number two. Aren\'t I cool?\n\nI am a Markdown file.\n')
    expect(output[4].content).toBe('# Number 3\n\nI am number three. Aren\'t I cool?\n\nI am a Markdown file.\n')
    expect(output[5].content).toBe('/* two.js */\n\nmodule.export = (two) => two\n\n/* I am a JavaScript file. */\n')
    expect(output[6].content).toBe('module.export = (three) => three')
    expect(output[7].content).toBe('{"one":1,"two":2,"three":3,"four":4,"type":"json"}')
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
  bundle.output = bundle.output.map(output => {
    const ext = path.extname(output.source.path).replace('.', '')
    output.content += '\n\n' + (tags[ext] ? tags[ext][0] : '') + 'I am a ' + (typeMap[ext] ? typeMap[ext] : ext.toUpperCase()) + ' file.' + (tags[ext] ? tags[ext][1] : '') + '\n'
    return output
  })
  return bundle
}

function banner (bundle) {
  const path = require('path')
  bundle.output = bundle.output.map(output => {
    output.content = '/* ' + path.basename(output.source.path) + ' */\n\n' + output.content
    return output
  })
  return bundle
}

function markdown (bundle) {
  bundle.output = bundle.output.map(output => {
    output.content += ' Aren\'t I cool?'
    return output
  })
  return bundle
}

function css (bundle) {
  bundle.output = bundle.output.map(output => {
    output.content += '\n\n.my-dynamic-selector { display: block; }'
    return output
  })
  return bundle
}

function json (bundle) {
  bundle.output = bundle.output.map(output => {
    const json = JSON.parse(output.content)
    json.four = 4
    json.type = 'json'
    output.content = JSON.stringify(json)
    return output
  })
  return bundle
}
