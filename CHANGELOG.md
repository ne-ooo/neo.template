# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/).

## [0.1.0] - 2026-03-09

### Added

- **`render(template, data, options?)`** — Render a Mustache/Handlebars template string
- **`compile(template, options?)`** — Pre-compile a template for repeated rendering
- **Mustache syntax** — `{{variable}}`, `{{#section}}`, `{{^inverted}}`, `{{> partial}}`, `{{{unescaped}}}`
- **Handlebars helpers** — `{{#if}}`, `{{#unless}}`, `{{#each}}`, `{{#with}}`, `{{#eq}}`
- **`./parser`** sub-path — Template parser/tokenizer
- **`./compiler`** sub-path — Template compiler to optimized render function
- **`./runtime`** sub-path — Runtime renderer for pre-compiled templates
- 83/83 tests passing
- 17x smaller than Handlebars (12 KB vs 206 KB)
- Zero runtime dependencies
- ESM + CJS dual output with TypeScript declaration files
- Tree-shakeable (`sideEffects: false`)
