/**
 * Benchmarks vs Mustache.js
 */

import { bench, describe } from 'vitest'
import { render as neoRender, compile as neoCompile } from '../../src/index.js'
import Mustache from 'mustache'

describe('Simple Variable Rendering', () => {
  const template = 'Hello {{name}}!'
  const context = { name: 'World' }

  bench('neo.template render', () => {
    neoRender(template, context)
  })

  bench('mustache.js render', () => {
    Mustache.render(template, context)
  })
})

describe('Compiled Template Execution', () => {
  const template = 'Hello {{name}}!'
  const context = { name: 'World' }

  // neo.template: Pre-compile to a reusable function
  const neoCompiled = neoCompile(template)

  // Mustache.js: Parse template once for caching (different API)
  Mustache.parse(template)

  bench('neo.template compiled', () => {
    neoCompiled(context)
  })

  bench('mustache.js parsed', () => {
    // Mustache uses parsed cache internally
    Mustache.render(template, context)
  })
})

describe('Section with Array', () => {
  const template = '{{#items}}<li>{{.}}</li>{{/items}}'
  const context = { items: [1, 2, 3, 4, 5] }

  bench('neo.template render', () => {
    neoRender(template, context)
  })

  bench('mustache.js render', () => {
    Mustache.render(template, context)
  })
})

describe('Section with Objects', () => {
  const template = '{{#users}}<div>{{name}}: {{email}}</div>{{/users}}'
  const context = {
    users: [
      { name: 'Alice', email: 'alice@example.com' },
      { name: 'Bob', email: 'bob@example.com' },
      { name: 'Charlie', email: 'charlie@example.com' },
    ],
  }

  bench('neo.template render', () => {
    neoRender(template, context)
  })

  bench('mustache.js render', () => {
    Mustache.render(template, context)
  })
})

describe('Complex Template', () => {
  const template = `
    <div class="user">
      <h1>{{user.name}}</h1>
      <p>{{user.bio}}</p>
      <ul>
        {{#user.posts}}
          <li>
            <h2>{{title}}</h2>
            <p>{{content}}</p>
            <span>{{likes}} likes</span>
          </li>
        {{/user.posts}}
      </ul>
    </div>
  `

  const context = {
    user: {
      name: 'John Doe',
      bio: 'Software developer',
      posts: [
        { title: 'Post 1', content: 'Content 1', likes: 10 },
        { title: 'Post 2', content: 'Content 2', likes: 20 },
        { title: 'Post 3', content: 'Content 3', likes: 30 },
      ],
    },
  }

  bench('neo.template render', () => {
    neoRender(template, context)
  })

  bench('mustache.js render', () => {
    Mustache.render(template, context)
  })
})

describe('Inverted Sections', () => {
  const template = '{{^items}}No items{{/items}}{{#items}}{{.}}{{/items}}'
  
  bench('neo.template (empty)', () => {
    neoRender(template, { items: [] })
  })

  bench('mustache.js (empty)', () => {
    Mustache.render(template, { items: [] })
  })

  bench('neo.template (with items)', () => {
    neoRender(template, { items: [1, 2, 3] })
  })

  bench('mustache.js (with items)', () => {
    Mustache.render(template, { items: [1, 2, 3] })
  })
})

describe('HTML Escaping', () => {
  const template = '{{html}} vs {{{raw}}}'
  const context = { 
    html: '<script>alert("xss")</script>',
    raw: '<strong>Bold</strong>',
  }

  bench('neo.template render', () => {
    neoRender(template, context)
  })

  bench('mustache.js render', () => {
    Mustache.render(template, context)
  })
})

describe('Large Dataset', () => {
  const template = '{{#items}}<tr><td>{{id}}</td><td>{{name}}</td><td>{{value}}</td></tr>{{/items}}'
  const items = Array.from({ length: 100 }, (_, i) => ({
    id: i,
    name: `Item ${i}`,
    value: Math.random() * 100,
  }))
  const context = { items }

  bench('neo.template render (100 items)', () => {
    neoRender(template, context)
  })

  bench('mustache.js render (100 items)', () => {
    Mustache.render(template, context)
  })
})
