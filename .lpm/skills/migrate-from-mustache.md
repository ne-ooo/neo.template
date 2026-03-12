---
name: migrate-from-mustache
description: Migration guide from Mustache.js and Handlebars to neo.template — same Mustache syntax, render/compile API, partials, helpers (like Handlebars), HTML escaping, TemplateError with line/col, tree-shakeable, TypeScript native, zero dependencies, lighter than both
version: "1.0.0"
globs:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.js"
  - "**/*.jsx"
---

# Migrating from Mustache.js / Handlebars to @lpm.dev/neo.template

## Why Migrate

| | Mustache.js | Handlebars | neo.template |
|---|-------------|------------|--------------|
| **Bundle** | ~16 KB min | ~77 KB min | ~5 KB |
| **Helpers** | No | Yes | Yes |
| **Tree-shaking** | No | No | Yes |
| **TypeScript** | `@types/mustache` | `@types/handlebars` | Built-in |
| **ESM** | Partial | Partial | ESM + CJS |
| **Dependencies** | Zero | Several | Zero |
| **Error reporting** | Basic | Basic | Line + column |

## Migrating from Mustache.js

### render()

```typescript
// Before — Mustache.js
import Mustache from 'mustache'

Mustache.render('Hello, {{name}}!', { name: 'World' })

// After — same syntax, different import
import { render } from '@lpm.dev/neo.template'

render('Hello, {{name}}!', { name: 'World' })
```

### Partials

```typescript
// Before — Mustache.js (partials as third argument object)
Mustache.render('{{> header}} Content', data, {
  header: '<h1>{{title}}</h1>'
})

// After — partials in options object
render('{{> header}} Content', data, {
  partials: {
    header: '<h1>{{title}}</h1>'
  }
})
```

The only difference: partials move from the third argument to `options.partials`.

### Pre-parsing (Mustache.parse → compile)

```typescript
// Before — Mustache.js pre-parsing
Mustache.parse(template)  // Caches internally
Mustache.render(template, data)  // Uses cached parse

// After — explicit compile
const tmpl = compile(template)
tmpl(data)   // Already compiled, fast
tmpl(data2)  // Reuse
```

neo.template uses explicit `compile()` instead of Mustache.js's implicit caching. This is more predictable and tree-shakeable.

### All Syntax Compatible

| Syntax | Mustache.js | neo.template |
|--------|-------------|--------------|
| `{{variable}}` | Escaped | Escaped |
| `{{{variable}}}` | Unescaped | Unescaped |
| `{{&variable}}` | Unescaped | Unescaped |
| `{{#section}}...{{/section}}` | Truthy/array | Truthy/array |
| `{{^section}}...{{/section}}` | Inverted | Inverted |
| `{{! comment}}` | Comment | Comment |
| `{{> partial}}` | Partial | Partial |
| `{{.}}` | Current value | Current value |
| `{{a.b.c}}` | Dot notation | Dot notation |

## Migrating from Handlebars

### Basic Rendering

```typescript
// Before — Handlebars
import Handlebars from 'handlebars'

const template = Handlebars.compile('Hello, {{name}}!')
template({ name: 'World' })

// After — same pattern
import { compile } from '@lpm.dev/neo.template'

const template = compile('Hello, {{name}}!')
template({ name: 'World' })
```

### Helpers

```typescript
// Before — Handlebars (global registration)
Handlebars.registerHelper('uppercase', function(str) {
  return str.toUpperCase()
})
const template = Handlebars.compile('{{uppercase name}}')
template({ name: 'alice' })

// After — helpers passed per render/compile (no global state)
import { render } from '@lpm.dev/neo.template'

render('{{uppercase}}', { name: 'alice' }, {
  helpers: {
    uppercase: (ctx) => String(ctx.name).toUpperCase()
  }
})
```

**Key difference:** neo.template helpers receive the full context object as the first argument, not individual arguments. There's no global helper registry — helpers are passed in options.

### Partials

```typescript
// Before — Handlebars (global registration)
Handlebars.registerPartial('header', '<h1>{{title}}</h1>')
const template = Handlebars.compile('{{> header}}')
template({ title: 'Hello' })

// After — partials passed per render/compile
render('{{> header}}', { title: 'Hello' }, {
  partials: { header: '<h1>{{title}}</h1>' }
})

// Or use a resolver function (like a dynamic partial loader)
render('{{> header}}', data, {
  partials: (name) => loadPartial(name)
})
```

No global registration — partials are scoped to each render/compile call.

## Handlebars Features NOT in neo.template

neo.template implements core Mustache syntax. Some Handlebars-specific features are not supported:

| Handlebars Feature | Status | Alternative |
|-------------------|--------|-------------|
| `{{#if condition}}` | Not built-in | Use `{{#condition}}...{{/condition}}` |
| `{{#each items}}` | Not built-in | Use `{{#items}}...{{/items}}` (same result) |
| `{{#unless condition}}` | Not built-in | Use `{{^condition}}...{{/condition}}` |
| `{{#with context}}` | Not built-in | Use `{{#context}}...{{/context}}` |
| `{{else}}` | Not supported | Use inverted section `{{^key}}` |
| Block helpers | Not supported | Use helpers + sections |
| `@index`, `@key`, `@first`, `@last` | Not supported | Use pre-processed context |
| Custom delimiters `{{=<% %>=}}` | Not supported | — |
| SafeString | Not supported | Use `{{{var}}}` for unescaped |

### Workarounds for Common Handlebars Patterns

```typescript
// Handlebars {{#if}} → Mustache section
// Before:  {{#if isAdmin}}Admin{{/if}}
// After:   {{#isAdmin}}Admin{{/isAdmin}}

// Handlebars {{else}} → Inverted section
// Before:  {{#if loggedIn}}Welcome{{else}}Sign in{{/if}}
// After:   {{#loggedIn}}Welcome{{/loggedIn}}{{^loggedIn}}Sign in{{/loggedIn}}

// Handlebars {{#each}} → Direct section
// Before:  {{#each items}}<li>{{this}}</li>{{/each}}
// After:   {{#items}}<li>{{.}}</li>{{/items}}

// Handlebars @index → Pre-process data
// Before:  {{#each items}}<li>{{@index}}: {{this}}</li>{{/each}}
// After:
const data = {
  items: items.map((item, i) => ({ value: item, index: i }))
}
render('{{#items}}<li>{{index}}: {{value}}</li>{{/items}}', data)
```

## Better Error Reporting

```typescript
// Mustache.js — generic error
Mustache.render('{{#unclosed}}')  // Error without location

// Handlebars — some error context
Handlebars.compile('{{#unclosed}}')  // Parse error

// neo.template — precise location
import { TemplateError } from '@lpm.dev/neo.template'

try {
  render('{{#unclosed}}')
} catch (err) {
  if (err instanceof TemplateError) {
    err.message  // 'Unclosed section {{#unclosed}} at line 1, column 1'
    err.line     // 1
    err.col      // 1
  }
}
```

## Migration Checklist

### From Mustache.js
- [ ] Replace `import Mustache from 'mustache'` with `import { render, compile } from '@lpm.dev/neo.template'`
- [ ] Replace `Mustache.render(tmpl, data, partials)` with `render(tmpl, data, { partials })`
- [ ] Replace `Mustache.parse(tmpl)` + `Mustache.render(tmpl, data)` with `compile(tmpl)` + `tmpl(data)`
- [ ] Remove `@types/mustache` (types are built-in)
- [ ] Remove `mustache` from dependencies

### From Handlebars
- [ ] Replace `import Handlebars from 'handlebars'` with `import { render, compile } from '@lpm.dev/neo.template'`
- [ ] Move `Handlebars.registerHelper()` calls to `options.helpers` objects
- [ ] Move `Handlebars.registerPartial()` calls to `options.partials` objects
- [ ] Rewrite helpers to accept `(context)` instead of individual arguments
- [ ] Replace `{{#if}}` / `{{#each}}` / `{{#unless}}` with Mustache equivalents
- [ ] Replace `{{else}}` blocks with inverted sections `{{^key}}`
- [ ] Replace `@index` / `@key` with pre-processed data
- [ ] Remove `@types/handlebars` (types are built-in)
- [ ] Remove `handlebars` from dependencies
