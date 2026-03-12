# @lpm.dev/neo.template

> Modern, lightweight template engine with Mustache/Handlebars syntax

**17x smaller than Handlebars** · **TypeScript-first** · **Zero dependencies** · **Tree-shakeable**

[![Bundle Size](https://img.shields.io/badge/bundle-12%20KB-success)](https://bundlephobia.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/tests-83%2F83-success)]()
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

## Why neo.template?

The JavaScript template engine ecosystem is dominated by old, heavy libraries:

- **Handlebars**: 206 KB, CommonJS, multiple dependencies
- **Mustache.js**: 20 KB, 5 years since last major update
- **Modern alternatives**: Different syntax, learning curve

**neo.template** brings the best of both worlds:

| Feature | neo.template | Mustache.js | Handlebars |
|---------|--------------|-------------|------------|
| **Size** | **12 KB** | 20 KB | 206 KB |
| **Format** | ESM + CJS | CommonJS | CommonJS |
| **TypeScript** | ✅ Native | ❌ Types only | ✅ Included |
| **Tree-shakeable** | ✅ Yes | ❌ No | ❌ No |
| **Dependencies** | **0** | 0 | Multiple |
| **Syntax** | Mustache/Handlebars | Mustache | Handlebars |

## Installation

```bash
lpm install @lpm.dev/neo.template
```

```bash
lpm install @lpm.dev/neo.template
```

```bash
lpm install @lpm.dev/neo.template
```

## Quick Start

```typescript
import { render, compile } from '@lpm.dev/neo.template'

// Simple rendering
const result = render('Hello {{name}}!', { name: 'World' })
console.log(result) // => 'Hello World!'

// Compile once, render many times (faster)
const template = compile('Hello {{name}}!')
console.log(template({ name: 'Alice' })) // => 'Hello Alice!'
console.log(template({ name: 'Bob' }))   // => 'Hello Bob!'
```

## Features

### ✨ Full Mustache/Handlebars Syntax

```typescript
import { render } from '@lpm.dev/neo.template'

// Variables (HTML-escaped by default)
render('{{name}}', { name: '<script>' })
// => '&lt;script&gt;'

// Unescaped output
render('{{{html}}}', { html: '<strong>Bold</strong>' })
// => '<strong>Bold</strong>'

// Sections (loops)
render('{{#items}}{{.}} {{/items}}', { items: [1, 2, 3] })
// => '1 2 3 '

// Inverted sections
render('{{^items}}No items{{/items}}', { items: [] })
// => 'No items'

// Comments (ignored in output)
render('Hello{{! this is ignored}} World')
// => 'Hello World'
```

### 🔄 Array Iteration

```typescript
// Array of primitives
render('{{#items}}{{.}} {{/items}}', { 
  items: [1, 2, 3] 
})
// => '1 2 3 '

// Array of objects
render('{{#users}}<li>{{name}}</li>{{/users}}', {
  users: [
    { name: 'Alice' },
    { name: 'Bob' },
    { name: 'Charlie' }
  ]
})
// => '<li>Alice</li><li>Bob</li><li>Charlie</li>'
```

### 🎯 Nested Contexts

```typescript
render(`
  {{#user}}
    <h1>{{name}}</h1>
    {{#posts}}
      <article>{{title}}</article>
    {{/posts}}
  {{/user}}
`, {
  user: {
    name: 'John',
    posts: [
      { title: 'Post 1' },
      { title: 'Post 2' }
    ]
  }
})
```

### 📍 Dotted Paths

```typescript
render('{{user.profile.name}}', {
  user: {
    profile: {
      name: 'Alice'
    }
  }
})
// => 'Alice'
```

### 🛡️ XSS Protection

HTML is escaped by default for security:

```typescript
render('{{html}}', { html: '<script>alert("xss")</script>' })
// => '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'

// Explicitly unescaped when you need it
render('{{{html}}}', { html: '<strong>Safe HTML</strong>' })
// => '<strong>Safe HTML</strong>'
```

## API Reference

### `render(template, context, options?)`

Renders a template with context data. This parses, compiles, and executes in one call.

```typescript
import { render } from '@lpm.dev/neo.template'

const output = render(
  'Hello {{name}}!',
  { name: 'World' },
  { noEscape: false } // optional
)
```

**Parameters:**
- `template` (string): Template string with Mustache/Handlebars syntax
- `context` (object): Data object for template variables
- `options` (object, optional):
  - `noEscape` (boolean): Disable HTML escaping globally
  - `partials` (object | function): Partial templates (see below)

**Returns:** string

**Use when:** Rendering templates once or infrequently.

### `compile(template, options?)`

Compiles a template to a reusable function. More efficient for repeated rendering.

```typescript
import { compile } from '@lpm.dev/neo.template'

const template = compile('Hello {{name}}!')

// Render many times with different data
template({ name: 'Alice' })  // => 'Hello Alice!'
template({ name: 'Bob' })    // => 'Hello Bob!'
template({ name: 'Charlie' }) // => 'Hello Charlie!'
```

**Parameters:**
- `template` (string): Template string
- `options` (object, optional): Same as `render()`

**Returns:** `(context: object) => string`

**Use when:** Rendering the same template multiple times with different data.

### `tokenize(template)`

Low-level API: Converts template string to tokens.

```typescript
import { tokenize } from '@lpm.dev/neo.template'

const tokens = tokenize('Hello {{name}}!')
// Returns array of tokens for parser
```

**Use when:** Building tools or debugging template parsing.

### `parse(tokens)`

Low-level API: Converts tokens to Abstract Syntax Tree (AST).

```typescript
import { tokenize, parse } from '@lpm.dev/neo.template'

const tokens = tokenize('Hello {{name}}!')
const ast = parse(tokens)
// Returns AST nodes
```

**Use when:** Analyzing template structure or building custom compilers.

## Syntax Guide

### Variables

```typescript
// Simple variable
{{name}}

// Dotted path
{{user.profile.name}}

// Current context (in arrays)
{{#items}}{{.}}{{/items}}
```

### Sections

Sections iterate over arrays or conditionally render based on truthiness:

```typescript
// Array iteration
{{#users}}
  <li>{{name}}</li>
{{/users}}

// Conditional rendering (truthy)
{{#isLoggedIn}}
  Welcome back!
{{/isLoggedIn}}

// Nested sections
{{#article}}
  {{#comments}}
    <div>{{text}}</div>
  {{/comments}}
{{/article}}
```

### Inverted Sections

Render when value is falsy or empty:

```typescript
{{^items}}
  <p>No items found</p>
{{/items}}

{{^isLoggedIn}}
  <p>Please log in</p>
{{/isLoggedIn}}
```

**Falsy values:** `false`, `0`, `null`, `undefined`, `''`, `[]`

### Unescaped Output

```typescript
// Triple braces
{{{htmlContent}}}

// Ampersand syntax
{{&htmlContent}}
```

### Comments

```typescript
{{! This is a comment and won't appear in output }}

{{! 
  Multi-line comments
  are also supported
}}
```

### Partials

```typescript
const options = {
  partials: {
    header: '<h1>{{title}}</h1>',
    footer: '<footer>{{year}}</footer>'
  }
}

render('{{> header}} Content {{> footer}}', context, options)
```

## Advanced Usage

### Partials

Partials allow template reuse:

```typescript
import { render } from '@lpm.dev/neo.template'

const template = `
  {{> header}}
  <main>{{content}}</main>
  {{> footer}}
`

const context = {
  title: 'My Page',
  content: 'Page content',
  year: 2026
}

const options = {
  partials: {
    header: '<header><h1>{{title}}</h1></header>',
    footer: '<footer>&copy; {{year}}</footer>'
  }
}

const output = render(template, context, options)
```

**Dynamic partials:**

```typescript
const options = {
  partials: (name) => {
    // Load partials dynamically
    return loadPartialFromFile(name)
  }
}
```

### Disable Escaping

```typescript
// Disable escaping globally
render('{{html}}', { html: '<b>Bold</b>' }, { noEscape: true })
// => '<b>Bold</b>'

// Or use unescaped syntax
render('{{{html}}}', { html: '<b>Bold</b>' })
// => '<b>Bold</b>'
```

### TypeScript

Full TypeScript support with type inference:

```typescript
import { render, compile, type TemplateContext } from '@lpm.dev/neo.template'

interface User {
  name: string
  email: string
  posts: Array<{ title: string }>
}

const context: TemplateContext = {
  user: {
    name: 'Alice',
    email: 'alice@example.com',
    posts: [{ title: 'Post 1' }]
  }
}

const template = compile<User>('{{user.name}}')
const output = template(context) // Type-safe!
```

## Migration Guide

### From Mustache.js

neo.template is fully compatible with Mustache.js syntax:

```typescript
// Before (Mustache.js)
import Mustache from 'mustache'
const output = Mustache.render('Hello {{name}}!', { name: 'World' })

// After (neo.template)
import { render } from '@lpm.dev/neo.template'
const output = render('Hello {{name}}!', { name: 'World' })
```

**Differences:**
- ✅ Same syntax
- ✅ Same semantics
- ✅ 40% smaller bundle
- ✅ TypeScript support
- ✅ Modern ESM

### From Handlebars

Most Handlebars templates work with minimal changes:

```typescript
// Handlebars syntax that works:
{{variable}}
{{#each items}}{{this}}{{/each}}  // Use {{#items}}{{.}}{{/items}}
{{#if condition}}...{{/if}}       // Use {{#condition}}...{{/condition}}
{{{raw}}}

// Not yet supported:
{{#each items}}{{@index}}{{/each}} // Helpers (@index, @key, etc.)
{{#with user}}...{{/with}}         // Use {{#user}}...{{/user}}
{{helper arg1 arg2}}               // Custom helpers (planned)
```

**Migration steps:**
1. Replace `{{#each}}` with section syntax: `{{#items}}`
2. Replace `{{#if}}` with sections: `{{#condition}}`
3. Replace `{{this}}` with `{{.}}`
4. Remove custom helpers (or wait for helper support)

## Performance

neo.template is optimized for speed and bundle size:

### Bundle Size

```
neo.template:  12 KB   ⚡️ (17x smaller than Handlebars!)
Mustache.js:   20 KB
Handlebars:    206 KB
```

### Execution Speed

Benchmarks show competitive performance with established libraries. See `npm run bench` for detailed results.

**Tips for best performance:**
1. **Use `compile()` for repeated rendering** - Compile once, render many times
2. **Keep templates simple** - Complex logic belongs in your data layer
3. **Pre-compile in build step** - For maximum runtime performance

## Examples

### User List

```typescript
const template = `
  <ul class="users">
    {{#users}}
      <li class="user">
        <h3>{{name}}</h3>
        <p>{{email}}</p>
        {{#posts}}
          <article>{{title}}</article>
        {{/posts}}
      </li>
    {{/users}}
    {{^users}}
      <li>No users found</li>
    {{/users}}
  </ul>
`

const context = {
  users: [
    {
      name: 'Alice',
      email: 'alice@example.com',
      posts: [{ title: 'Hello World' }]
    }
  ]
}

const output = render(template, context)
```

### Conditional Content

```typescript
const template = `
  {{#user}}
    <div class="logged-in">
      Welcome, {{name}}!
      <a href="/logout">Logout</a>
    </div>
  {{/user}}
  {{^user}}
    <div class="logged-out">
      <a href="/login">Login</a>
    </div>
  {{/user}}
`
```

### Nested Data

```typescript
const template = `
  {{#article}}
    <article>
      <h1>{{title}}</h1>
      <p>By {{author.name}}</p>
      
      <div class="content">{{content}}</div>
      
      <section class="comments">
        {{#comments}}
          <div class="comment">
            <strong>{{user.name}}</strong>
            <p>{{text}}</p>
          </div>
        {{/comments}}
        {{^comments}}
          <p>No comments yet</p>
        {{/comments}}
      </section>
    </article>
  {{/article}}
`
```

## Tree-Shaking

Import only what you need for optimal bundle size:

```typescript
// Import just render (smallest)
import { render } from '@lpm.dev/neo.template'

// Import specific functions
import { compile, tokenize } from '@lpm.dev/neo.template'

// Import from subpaths (even more granular)
import { tokenize } from '@lpm.dev/neo.template/parser'
import { escapeHTML } from '@lpm.dev/neo.template/runtime'
```

## Browser Support

- ✅ Chrome, Firefox, Safari, Edge (latest 2 versions)
- ✅ Node.js 18+
- ✅ Deno, Bun (ESM)
- ✅ All modern bundlers (Vite, Webpack, Rollup, etc.)
