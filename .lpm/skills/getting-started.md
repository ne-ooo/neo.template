---
name: getting-started
description: How to use neo.template — render() for one-shot rendering, compile() for reusable templates, Mustache/Handlebars syntax (variables, sections, inverted sections, comments, partials, unescaped output), helpers, dot notation, HTML escaping, TemplateError with line/col, subpath imports (parser, compiler, runtime), TypeScript types
version: "1.0.0"
globs:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.js"
  - "**/*.jsx"
---

# Getting Started with @lpm.dev/neo.template

## Overview

neo.template is a zero-dependency template engine with Mustache/Handlebars syntax. Lightweight, tree-shakeable, TypeScript-first. Supports variables, sections, partials, helpers, and HTML escaping out of the box.

## Quick Start

```typescript
import { render, compile } from '@lpm.dev/neo.template'

// One-shot rendering
render('Hello, {{name}}!', { name: 'World' })
// 'Hello, World!'

// Compile once, render many times
const tmpl = compile('Hello, {{name}}!')
tmpl({ name: 'Alice' })  // 'Hello, Alice!'
tmpl({ name: 'Bob' })    // 'Hello, Bob!'
```

## Variables

```typescript
// Escaped by default (XSS safe)
render('{{name}}', { name: '<b>bold</b>' })
// '&lt;b&gt;bold&lt;&#x2F;b&gt;'

// Unescaped — triple braces or ampersand
render('{{{html}}}', { html: '<b>bold</b>' })
// '<b>bold</b>'
render('{{&html}}', { html: '<b>bold</b>' })
// '<b>bold</b>'

// Dot notation for nested values
render('{{user.name}}', { user: { name: 'Alice' } })
// 'Alice'

// Missing variables render as empty string
render('Hello, {{name}}!', {})
// 'Hello, !'
```

## Sections

Sections render their block based on the value's truthiness.

```typescript
// Truthy value — renders block once
render('{{#show}}Visible{{/show}}', { show: true })
// 'Visible'

// Falsy value — skipped
render('{{#show}}Visible{{/show}}', { show: false })
// ''

// Array — iterates, merging each item into context
render('{{#items}}{{name}} {{/items}}', {
  items: [{ name: 'A' }, { name: 'B' }, { name: 'C' }]
})
// 'A B C '

// Simple array values — use {{.}} for current item
render('{{#colors}}{{.}}, {{/colors}}', {
  colors: ['red', 'green', 'blue']
})
// 'red, green, blue, '

// Object — merges properties into context
render('{{#user}}{{name}} ({{email}}){{/user}}', {
  user: { name: 'Alice', email: 'alice@example.com' }
})
// 'Alice (alice@example.com)'
```

### Inverted Sections

Renders when the value is falsy or an empty array.

```typescript
render('{{^items}}No items found{{/items}}', { items: [] })
// 'No items found'

render('{{^loggedIn}}Please sign in{{/loggedIn}}', { loggedIn: false })
// 'Please sign in'
```

### Falsy Values

These values cause sections to NOT render (and inverted sections TO render):
- `false`, `0`, `null`, `undefined`, `""` (empty string), `[]` (empty array)

## Comments

```typescript
render('Hello{{! this is a comment}} World', {})
// 'Hello World'
```

Comments are stripped from output entirely.

## Partials

Include reusable template fragments.

```typescript
// Map of partials
render('{{> header}} Content {{> footer}}', {}, {
  partials: {
    header: '<h1>Header</h1>',
    footer: '<footer>Footer</footer>'
  }
})
// '<h1>Header</h1> Content <footer>Footer</footer>'

// Resolver function
render('{{> greeting}}', { name: 'Alice' }, {
  partials: (name) => {
    if (name === 'greeting') return 'Hello, {{name}}!'
    return undefined
  }
})

// Missing partials render as empty string
render('{{> missing}}', {})
// ''
```

## Helpers

Custom functions accessible in templates.

```typescript
render('{{uppercase}}', { name: 'alice' }, {
  helpers: {
    uppercase: (ctx) => String(ctx.name).toUpperCase()
  }
})
// 'ALICE'

// Context values take precedence over helpers with the same name
render('{{name}}', { name: 'from context' }, {
  helpers: { name: () => 'from helper' }
})
// 'from context'
```

## Compile for Performance

```typescript
import { compile } from '@lpm.dev/neo.template'

// Compile once
const template = compile('Hello, {{name}}! You have {{count}} messages.')

// Render many times — 2-3x faster than repeated render() calls
const results = users.map(user => template(user))
```

Use `compile()` when rendering the same template with different data (email templates, list items, reports).

## HTML Escaping

Variables are HTML-escaped by default, protecting against XSS:

```typescript
// Escaped characters: & < > " ' /
render('{{input}}', { input: '<script>alert("XSS")</script>' })
// '&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;'

// Disable escaping globally
render('{{input}}', { input: '<b>bold</b>' }, { noEscape: true })
// '<b>bold</b>'

// Disable per-variable with triple braces
render('{{{input}}}', { input: '<b>bold</b>' })
// '<b>bold</b>'
```

## Error Handling

```typescript
import { render, TemplateError } from '@lpm.dev/neo.template'

try {
  render('{{#unclosed}}')
} catch (err) {
  if (err instanceof TemplateError) {
    console.log(err.message)  // 'Unclosed section {{#unclosed}} at line 1, column 1'
    console.log(err.line)     // 1
    console.log(err.col)      // 1
  }
}
```

`TemplateError` includes `line` and `col` for precise error location.

## Subpath Imports

```typescript
// Parser only — tokenize and parse templates
import { tokenize, parse } from '@lpm.dev/neo.template/parser'

const tokens = tokenize('Hello, {{name}}!')
const ast = parse(tokens)

// Compiler only
import { compile } from '@lpm.dev/neo.template/compiler'

// Runtime utilities
import { escapeHTML, getValue, isFalsy, isArrayLike } from '@lpm.dev/neo.template/runtime'

escapeHTML('<script>')           // '&lt;script&gt;'
getValue({ a: { b: 1 } }, 'a.b')  // 1
isFalsy(null)                   // true
isFalsy([])                     // true (empty array is falsy)
isArrayLike([1, 2])             // true
```

## TypeScript Types

```typescript
import type {
  TemplateContext,      // Record<string, unknown>
  CompiledTemplate,     // (context: TemplateContext) => string
  HelperFunction,       // (context: TemplateContext, ...args: unknown[]) => unknown
  PartialResolver,      // (name: string) => string | undefined
  TemplateOptions,      // { helpers?, partials?, noEscape? }
  Token,                // { type, value, line, col }
  ASTNode,              // TextNode | VariableNode | SectionNode | ...
} from '@lpm.dev/neo.template'

import { TokenType, TemplateError } from '@lpm.dev/neo.template'
```

## Options Reference

```typescript
interface TemplateOptions {
  helpers?: Record<string, HelperFunction>   // Custom functions
  partials?: Record<string, string> | PartialResolver  // Template fragments
  noEscape?: boolean                         // Disable HTML escaping (default: false)
}
```
