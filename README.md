# @lpm.dev/neo.template

`@lpm.dev/neo.template` renders variables, sections, inverted sections,
comments, and partials with a Mustache-style syntax.

## Features

- **Templates:** Renders variables, dotted paths, sections, inverted sections,
  comments, and partials.
- **Escaping:** Variable tags escape HTML characters by default.
- **Reusable functions:** Compiles one template for multiple context objects.
- **Parser API:** Tokenizes templates and exposes their abstract syntax trees.
- **Module formats:** The package provides ESM and CommonJS entry points.
- **Dependency surface:** The package has no runtime dependencies.

## Install

Install the package with LPM:

```bash
lpm install @lpm.dev/neo.template
```

## Quick start

```typescript
import { compile, render } from "@lpm.dev/neo.template";

const result = render("Hello {{name}}!", { name: "World" });
console.log(result); // "Hello World!"

const template = compile("Hello {{name}}!");
console.log(template({ name: "Alice" })); // "Hello Alice!"
console.log(template({ name: "Bob" })); // "Hello Bob!"
```

## API

### `render(template, context?, options?): string`

`render()` tokenizes, parses, compiles, and renders one template.

**Parameters**

| Name       | Type              | Default  | Description                                |
| ---------- | ----------------- | -------- | ------------------------------------------ |
| `template` | `string`          | Required | The source template.                       |
| `context`  | `TemplateContext` | `{}`     | The values for variables and sections.     |
| `options`  | `TemplateOptions` | `{}`     | The escaping, partial, and helper options. |

**Returns:** `string` — The rendered text.

```typescript
import { render } from "@lpm.dev/neo.template";

const output = render(
  "Hello {{name}}!",
  { name: "World" },
  { noEscape: false },
);
```

### `compile(template, options?): CompiledTemplate`

`compile()` returns a reusable function that accepts a context object.

```typescript
import { compile } from "@lpm.dev/neo.template";

const template = compile("Hello {{name}}!");

template({ name: "Alice" }); // "Hello Alice!"
template({ name: "Bob" }); // "Hello Bob!"
template({ name: "Charlie" }); // "Hello Charlie!"
```

If the application renders the same template more than once, use `compile()`.

### `tokenize(template): Token[]`

`tokenize()` converts a template string into tokens with line and column
positions.

```typescript
import { tokenize } from "@lpm.dev/neo.template";

const tokens = tokenize("Hello {{name}}!");
```

The function throws `TemplateError` for an unclosed tag.

### `parse(tokens): ASTNode[]`

`parse()` converts a token array into an abstract syntax tree.

```typescript
import { parse, tokenize } from "@lpm.dev/neo.template";

const tokens = tokenize("Hello {{name}}!");
const ast = parse(tokens);
```

The function throws `TemplateError` for an unexpected, mismatched, or unclosed
section tag.

### `escapeHTML(value): string`

`escapeHTML()` replaces `&`, `<`, `>`, `"`, `'`, and `/` with HTML entities.

```typescript
import { escapeHTML } from "@lpm.dev/neo.template";

escapeHTML("<script>"); // "&lt;script&gt;"
escapeHTML("AT&T"); // "AT&amp;T"
```

### `getValue(context, path): unknown`

`getValue()` reads a dotted path from a context object. The path `.` reads the
current array item.

```typescript
import { getValue } from "@lpm.dev/neo.template";

getValue({ user: { name: "Alice" } }, "user.name"); // "Alice"
getValue({ user: { name: "Alice" } }, "user.age"); // undefined
```

### `TemplateOptions`

```typescript
interface TemplateOptions {
  helpers?: Record<string, HelperFunction>;
  partials?: Record<string, string> | PartialResolver;
  noEscape?: boolean;
}
```

`partials` accepts a name-to-template map or a resolver function. `helpers`
supplies functions for names that the context does not contain.

`noEscape: true` disables HTML escaping for all variable tags.

## Syntax

### Variables and paths

Variable tags escape HTML characters by default. Dotted paths read nested
context values.

```handlebars
{{name}}
{{user.profile.name}}
{{#items}}{{.}}{{/items}}
```

### Sections

Sections render for truthy values. They iterate over arrays and merge object
values into the current context.

```handlebars
{{#users}}
  <li>{{name}}</li>
{{/users}}

{{#isLoggedIn}}
  Welcome back!
{{/isLoggedIn}}
```

The package treats `false`, `0`, `null`, `undefined`, an empty string, and an
empty array as false values.

### Inverted sections

Inverted sections render for false values.

```handlebars
{{^items}}
  <p>No items found</p>
{{/items}}
```

### Unescaped output

Triple braces and ampersand tags return a value without HTML escaping.

```handlebars
{{{htmlContent}}}
{{&htmlContent}}
```

### Comments

Comments do not appear in the output.

```handlebars
{{! This text does not appear in the output. }}
```

### Partials

Partials render with the current context.

```typescript
const options = {
  partials: {
    header: "<h1>{{title}}</h1>",
    footer: "<footer>{{year}}</footer>",
  },
};

render("{{> header}} Content {{> footer}}", context, options);
```

A resolver function can load a partial by name:

```typescript
const options = {
  partials: (name: string) => loadPartialFromFile(name),
};
```

### Helpers

If the context does not contain a name, a helper can supply its value.

```typescript
const output = render("Generated: {{timestamp}}", context, {
  helpers: {
    timestamp: () => new Date().toISOString(),
  },
});
```

## Behavior and limits

- `render()` compiles the template for each call.
- `compile()` reuses the parsed and compiled template.
- A missing variable renders as an empty string.
- A missing partial renders as an empty string.
- A function section receives the current context and its return value becomes
  section output.
- Object and array sections inherit values from their parent context.

This package supports a focused Mustache-style syntax. It does not implement all
Mustache.js or Handlebars behavior.

The package does not support Handlebars block helpers, `@index`, `@key`, helper
arguments, or `with` syntax.

## Security

`@lpm.dev/neo.template` escapes HTML characters in variable tags by default. It
is not a general sanitizer for HTML, JavaScript, CSS, or URLs.

- Triple braces and ampersand tags return unescaped values.
- `noEscape: true` disables escaping for all variable tags.
- Partials and template text become output without sanitization.
- Helper values in variable tags follow the tag's escaping behavior.
- Function-section return values are not escaped.
- Template compilation uses the JavaScript `Function` constructor.
- The application must validate templates, partials, URLs, and context-specific
  output.

Do not use untrusted HTML with triple braces, ampersand tags, or
`noEscape: true`.

A Content Security Policy that blocks `unsafe-eval` also blocks `render()` and
`compile()`.

## Examples

### Render a user list

```typescript
import { render } from "@lpm.dev/neo.template";

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
`;

const context = {
  users: [
    {
      name: "Alice",
      email: "alice@example.com",
      posts: [{ title: "Hello World" }],
    },
  ],
};

const output = render(template, context);
```

### Use typed context values

```typescript
import { compile } from "@lpm.dev/neo.template";
import type { TemplateContext } from "@lpm.dev/neo.template";

const context: TemplateContext = {
  user: {
    name: "Alice",
    email: "alice@example.com",
    posts: [{ title: "Post 1" }],
  },
};

const template = compile("{{user.name}}");
const output = template(context);
```

## Migration from `Mustache.js`

Basic variables, sections, inverted sections, comments, and partials have
similar syntax. The package is not a complete Mustache.js implementation.

```diff
- import Mustache from "mustache";
- const output = Mustache.render("Hello {{name}}!", { name: "World" });
+ import { render } from "@lpm.dev/neo.template";
+ const output = render("Hello {{name}}!", { name: "World" });
```

Run tests for lambdas, partial indentation, delimiter changes, whitespace
behavior, and other Mustache.js features before migration.

## Migration from `Handlebars`

Replace common Handlebars blocks with sections:

| Handlebars                         | This package                      |
| ---------------------------------- | --------------------------------- |
| `{{#each items}}{{this}}{{/each}}` | `{{#items}}{{.}}{{/items}}`       |
| `{{#if condition}}...{{/if}}`      | `{{#condition}}...{{/condition}}` |
| `{{#with user}}...{{/with}}`       | `{{#user}}...{{/user}}`           |

Custom helper arguments, block helpers, `@index`, and `@key` do not map
directly. Rewrite these templates before migration.

## Performance

The repository contains benchmarks for rendering, compiled execution, arrays,
objects, nesting, and HTML escaping.

See [BENCHMARKS.md](./BENCHMARKS.md) for the environment, method, results, and
limits.

Run the benchmark suite:

```bash
lpm run bench
```

Use `compile()` for repeated rendering. Benchmark results depend on the runtime,
computer, template, and context data.

## Runtime support

- **Node.js:** 18 or later
- **Browsers:** Current Chrome, Firefox, Safari, and Edge versions
- **Other runtimes:** Deno and Bun through compatible ESM entry points
- **Module formats:** ESM and CommonJS
- **TypeScript:** Declaration files are included

## Package entry points

| Import                           | Purpose                                               |
| -------------------------------- | ----------------------------------------------------- |
| `@lpm.dev/neo.template`          | Main renderer, parser functions, utilities, and types |
| `@lpm.dev/neo.template/parser`   | Tokenizer and parser                                  |
| `@lpm.dev/neo.template/compiler` | Abstract-syntax-tree compiler                         |
| `@lpm.dev/neo.template/runtime`  | Runtime helpers                                       |

## License

MIT. See [LICENSE](./LICENSE).
