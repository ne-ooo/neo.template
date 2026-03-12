/**
 * @lpm.dev/neo.template
 * 
 * Modern, lightweight template engine with Mustache/Handlebars syntax
 * 
 * @example
 * ```ts
 * import { render, compile } from '@lpm.dev/neo.template'
 * 
 * // Simple rendering
 * const result = render('Hello {{name}}!', { name: 'World' })
 * // => 'Hello World!'
 * 
 * // Compile once, render many times
 * const template = compile('Hello {{name}}!')
 * template({ name: 'John' })  // => 'Hello John!'
 * template({ name: 'Jane' })  // => 'Hello Jane!'
 * ```
 */

export * from './types.js'
export { tokenize, parse } from './parser/index.js'
export { escapeHTML, getValue } from './utils/escape.js'

import { tokenize } from './parser/tokenizer.js'
import { parse } from './parser/parser.js'
import { compile as compileAST } from './compiler/compiler.js'
import { escapeHTML, getValue } from './utils/escape.js'
import type { TemplateContext, TemplateOptions, CompiledTemplate } from './types.js'

/**
 * Render a template with context data
 * 
 * This is a convenience function that tokenizes, parses, compiles,
 * and executes a template in one call.
 * 
 * For better performance when rendering the same template multiple times,
 * use `compile()` instead to compile once and reuse.
 * 
 * @param template - Template string
 * @param context - Context data
 * @param options - Template options
 * @returns Rendered output
 * 
 * @example
 * ```ts
 * render('Hello {{name}}!', { name: 'World' })
 * // => 'Hello World!'
 * 
 * render('{{#items}}{{.}}{{/items}}', { items: [1, 2, 3] })
 * // => '123'
 * 
 * render('{{{html}}}', { html: '<strong>Bold</strong>' })
 * // => '<strong>Bold</strong>'
 * ```
 */
export function render(
  template: string,
  context: TemplateContext = {},
  options: TemplateOptions = {}
): string {
  const tokens = tokenize(template)
  const ast = parse(tokens)
  const compiled = compileAST(ast, options)
  return compiled(context)
}

/**
 * Compile a template to a reusable function
 * 
 * Compiles a template once and returns a function that can be
 * called multiple times with different context data.
 * 
 * This is more efficient than `render()` when you need to render
 * the same template multiple times.
 * 
 * @param template - Template string
 * @param options - Template options
 * @returns Compiled template function
 * 
 * @example
 * ```ts
 * const template = compile('Hello {{name}}!')
 * 
 * template({ name: 'John' })  // => 'Hello John!'
 * template({ name: 'Jane' })  // => 'Hello Jane!'
 * template({ name: 'Bob' })   // => 'Hello Bob!'
 * ```
 */
export function compile(
  template: string,
  options: TemplateOptions = {}
): CompiledTemplate {
  const tokens = tokenize(template)
  const ast = parse(tokens)
  return compileAST(ast, options)
}

/**
 * Default export for convenience
 */
export default {
  render,
  compile,
  tokenize,
  parse,
  escapeHTML,
  getValue,
}
