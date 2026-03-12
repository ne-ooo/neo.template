/**
 * Benchmarks vs Handlebars
 */

import { bench, describe } from 'vitest'
import { render as neoRender, compile as neoCompile } from '../../src/index.js'
import Handlebars from 'handlebars'

describe('Handlebars - Simple Variable', () => {
  const template = 'Hello {{name}}!'
  const context = { name: 'World' }

  bench('neo.template render', () => {
    neoRender(template, context)
  })

  bench('handlebars render', () => {
    const hbTemplate = Handlebars.compile(template)
    hbTemplate(context)
  })
})

describe('Handlebars - Compiled Performance', () => {
  const template = 'Hello {{name}}!'
  const context = { name: 'World' }

  const neoCompiled = neoCompile(template)
  const hbCompiled = Handlebars.compile(template)

  bench('neo.template compiled', () => {
    neoCompiled(context)
  })

  bench('handlebars compiled', () => {
    hbCompiled(context)
  })
})

describe('Handlebars - Array Iteration', () => {
  const template = '{{#each items}}<li>{{this}}</li>{{/each}}'
  const neoTemplate = '{{#items}}<li>{{.}}</li>{{/items}}'
  const context = { items: [1, 2, 3, 4, 5] }

  bench('neo.template render', () => {
    neoRender(neoTemplate, context)
  })

  bench('handlebars render', () => {
    const hbTemplate = Handlebars.compile(template)
    hbTemplate(context)
  })
})

describe('Handlebars - Object Iteration', () => {
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

  bench('handlebars render', () => {
    const hbTemplate = Handlebars.compile(template)
    hbTemplate(context)
  })
})

describe('Handlebars - Nested Objects', () => {
  const template = `
    <div>
      <h1>{{user.name}}</h1>
      <p>{{user.bio}}</p>
      {{#user.posts}}
        <article>
          <h2>{{title}}</h2>
          <p>{{content}}</p>
        </article>
      {{/user.posts}}
    </div>
  `

  const context = {
    user: {
      name: 'John Doe',
      bio: 'Developer',
      posts: [
        { title: 'Post 1', content: 'Content 1' },
        { title: 'Post 2', content: 'Content 2' },
      ],
    },
  }

  bench('neo.template render', () => {
    neoRender(template, context)
  })

  bench('handlebars render', () => {
    const hbTemplate = Handlebars.compile(template)
    hbTemplate(context)
  })
})

describe('Handlebars - Large Dataset', () => {
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

  bench('handlebars render (100 items)', () => {
    const hbTemplate = Handlebars.compile(template)
    hbTemplate(context)
  })
})

describe('Handlebars - HTML Escaping', () => {
  const template = '{{html}} vs {{{raw}}}'
  const context = { 
    html: '<script>alert("xss")</script>',
    raw: '<strong>Bold</strong>',
  }

  bench('neo.template render', () => {
    neoRender(template, context)
  })

  bench('handlebars render', () => {
    const hbTemplate = Handlebars.compile(template)
    hbTemplate(context)
  })
})
