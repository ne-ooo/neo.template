---
name: anti-patterns
description: Common mistakes when using neo.template — render() recompiles every call (use compile() for reuse), 0 and false are falsy in sections but display as "0"/"false" in variables, empty array is falsy, context values shadow helpers with same name, partials not re-evaluated against context by default, unescaped output XSS risk, TemplateError not caught, nested section context merging
version: "1.0.0"
globs:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.js"
  - "**/*.jsx"
---

# Anti-Patterns for @lpm.dev/neo.template

### [CRITICAL] `render()` recompiles every call — use `compile()` for repeated rendering

Wrong:

```typescript
// AI uses render() in a loop — recompiles template on every iteration
const results = users.map(user =>
  render('Hello, {{name}}! You have {{count}} messages.', user)
)
// Template is tokenized, parsed, and compiled 1000x for 1000 users
```

Correct:

```typescript
// Compile once, render many times — 2-3x faster
const template = compile('Hello, {{name}}! You have {{count}} messages.')
const results = users.map(user => template(user))
```

`render()` calls tokenize → parse → compile → execute internally. For templates used more than once, `compile()` returns a reusable function that skips the first three steps on subsequent calls.

Source: `src/index.ts` — render() calls full pipeline each time

### [HIGH] `0` and `false` are falsy in sections but display as values in variables

Wrong:

```typescript
// AI expects 0 to render a section
render('{{#count}}You have {{count}} items{{/count}}', { count: 0 })
// '' — section doesn't render because 0 is falsy!

render('{{#active}}Status: active{{/active}}', { active: false })
// '' — section doesn't render because false is falsy!
```

Correct:

```typescript
// 0 and false are falsy — sections won't render
// Use inverted section for the "zero" case:
render('{{#count}}You have {{count}} items{{/count}}{{^count}}No items{{/count}}', { count: 0 })
// 'No items'

// Or check for existence differently:
render('{{#hasItems}}You have {{count}} items{{/hasItems}}', { hasItems: false, count: 0 })

// But as variables, 0 and false DO display their values:
render('Count: {{count}}', { count: 0 })
// 'Count: 0'

render('Active: {{active}}', { active: false })
// 'Active: false'
```

The Mustache spec defines falsy as: `false`, `0`, `null`, `undefined`, `""`, and `[]`. This means sections with `{{#count}}` won't render when count is 0. Variables `{{count}}` still display "0".

Source: `src/runtime/index.ts` — `isFalsy()` includes 0 and false

### [HIGH] Empty array `[]` is falsy — sections won't render

Wrong:

```typescript
// AI expects an empty array section to render (maybe to show a table header)
render('{{#items}}<table>...{{.}}...</table>{{/items}}', { items: [] })
// '' — empty array is falsy, entire section skipped!
```

Correct:

```typescript
// Use inverted section for empty state
const tmpl = `{{#items}}{{#items}}<li>{{.}}</li>{{/items}}{{/items}}{{^items}}<p>No items</p>{{/items}}`

render(tmpl, { items: ['a', 'b'] })
// '<li>a</li><li>b</li>'

render(tmpl, { items: [] })
// '<p>No items</p>'

// Or use a separate flag
render('{{#hasItems}}...list...{{/hasItems}}{{^hasItems}}Empty{{/hasItems}}', {
  hasItems: items.length > 0,
  items
})
```

In Mustache semantics, `[]` is falsy. If you need to always render a wrapper element regardless of array contents, put it outside the section.

Source: `src/runtime/index.ts` — `isFalsy()` checks `Array.isArray(value) && value.length === 0`

### [HIGH] Unescaped output `{{{var}}}` is an XSS vector

Wrong:

```typescript
// AI uses triple braces for user input
render('{{{comment}}}', { comment: userInput })
// If userInput = '<script>alert("XSS")</script>'
// Output: '<script>alert("XSS")</script>' — XSS vulnerability!
```

Correct:

```typescript
// Use double braces for user-provided content (escaped by default)
render('{{comment}}', { comment: userInput })
// '&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;' — safe

// Only use triple braces for trusted HTML content you control
render('{{{richContent}}}', { richContent: sanitizedHTML })

// noEscape: true also disables ALL escaping — dangerous with user input
render('{{comment}}', { comment: userInput }, { noEscape: true })  // XSS risk!
```

Double braces `{{var}}` escape `& < > " ' /` by default. Triple braces `{{{var}}}` and `{{&var}}` bypass escaping. Only use unescaped output for HTML you've sanitized or generated yourself.

Source: `src/runtime/index.ts` — `escapeHTML()` called for double braces only

### [MEDIUM] Context values shadow helpers with the same name

Wrong:

```typescript
// AI defines a helper expecting it to always run
render('{{format}}', { format: 'plain text' }, {
  helpers: {
    format: (ctx) => ctx.value.toUpperCase()
  }
})
// 'plain text' — context value wins, helper never called!
```

Correct:

```typescript
// Context values take precedence over helpers
// Use distinct names to avoid shadowing:
render('{{formatted}}', { value: 'hello' }, {
  helpers: {
    formatted: (ctx) => String(ctx.value).toUpperCase()
  }
})
// 'HELLO'

// Or don't put conflicting keys in context
render('{{format}}', {}, {
  helpers: {
    format: (ctx) => 'formatted output'
  }
})
// 'formatted output'
```

When a context key and helper share the same name, the context value is used. Name helpers distinctly from your data keys to avoid silent shadowing.

Source: `src/compiler/index.ts` — context lookup before helper lookup

### [MEDIUM] Mismatched section tags throw `TemplateError`

Wrong:

```typescript
// AI typos the closing tag name
render('{{#users}}...{{/user}}', { users: [] })
// TemplateError: Mismatched section tags: expected {{/users}}, got {{/user}}

// AI forgets to close a section
render('{{#show}}visible', { show: true })
// TemplateError: Unclosed section {{#show}}
```

Correct:

```typescript
// Opening and closing tags must match exactly
render('{{#users}}...{{/users}}', { users: [] })

// Always close sections
render('{{#show}}visible{{/show}}', { show: true })

// Catch errors for user-provided templates
import { TemplateError } from '@lpm.dev/neo.template'

try {
  render(userTemplate, data)
} catch (err) {
  if (err instanceof TemplateError) {
    console.error(`Template error at line ${err.line}, col ${err.col}: ${err.message}`)
  }
}
```

`TemplateError` provides `line` and `col` properties for precise error location. Always wrap `render()`/`compile()` with user-provided templates in try-catch.

Source: `src/parser/index.ts` — validates matching open/close tags

### [MEDIUM] Missing variables render as empty string — no error thrown

Wrong:

```typescript
// AI expects an error for missing variables
render('Hello, {{name}}!', {})
// 'Hello, !' — silently empty, no error

// AI expects undefined/null to display as "undefined"/"null"
render('Value: {{missing}}', {})
// 'Value: ' — not 'Value: undefined'
```

Correct:

```typescript
// Missing variables → empty string (Mustache spec behavior)
render('Hello, {{name}}!', {})
// 'Hello, !'

// If you need to detect missing variables, check context before rendering:
const required = ['name', 'email']
const missing = required.filter(key => !(key in context))
if (missing.length) {
  throw new Error(`Missing template variables: ${missing.join(', ')}`)
}

// null and undefined also render as empty string
render('{{value}}', { value: null })       // ''
render('{{value}}', { value: undefined })  // ''

// But 0 and false render as their string value
render('{{value}}', { value: 0 })          // '0'
render('{{value}}', { value: false })      // 'false'
```

This follows the Mustache specification — missing variables produce empty strings silently. Validate your context object before rendering if you need to ensure all variables are present.

Source: `src/runtime/index.ts` — `getValue()` returns undefined, rendered as ''

### [MEDIUM] Nested sections merge context — child keys can shadow parent keys

Wrong:

```typescript
// AI doesn't realize inner section shadows outer context
render('{{#user}}{{name}} - {{#address}}{{name}}{{/address}}{{/user}}', {
  user: { name: 'Alice', address: { name: 'Home', street: '123 Main' } }
})
// 'Alice - Home' — inner {{name}} resolved to address.name, not user.name
```

Correct:

```typescript
// Each section merges its value into context
// Inner sections shadow outer keys with same name

// Use distinct key names to avoid confusion:
render('{{#user}}{{userName}} - {{#address}}{{addressLabel}}{{/address}}{{/user}}', {
  user: {
    userName: 'Alice',
    address: { addressLabel: 'Home', street: '123 Main' }
  }
})
// 'Alice - Home'

// Or access the value you need at the right level:
render('{{#user}}{{name}} lives at {{address.street}}{{/user}}', {
  user: { name: 'Alice', address: { street: '123 Main' } }
})
// 'Alice lives at 123 Main'
```

When entering a section with an object value, the object's properties are merged into the current context with `{ ...parentContext, ...sectionValue }`. This means child keys with the same name as parent keys will shadow the parent values.

Source: `src/compiler/index.ts` — context spread merging in section rendering
