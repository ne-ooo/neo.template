/**
 * Template Compiler
 *
 * Compiles AST to executable JavaScript function
 */

import type {
  ASTNode,
  SectionNode,
  CompiledTemplate,
  TemplateContext,
  TemplateOptions,
} from '../types.js'
import { escapeHTML, getValue, isFalsy, isArrayLike } from '../utils/escape.js'
import { tokenize } from '../parser/tokenizer.js'
import { parse } from '../parser/parser.js'

/**
 * Compile AST to executable template function
 *
 * @param ast - AST nodes from parser
 * @param options - Template options
 * @returns Compiled template function
 *
 * @example
 * ```ts
 * const template = compile(ast)
 * const result = template({ name: 'John' })
 * ```
 */
export function compile(
  ast: ASTNode[],
  options: TemplateOptions = {}
): CompiledTemplate {
  // Generate function body code
  const code = compileNodes(ast, options)

  // Create compiled function
  return function renderTemplate(context: TemplateContext): string {
    let output = ''

    // Execute generated code
    try {
      output = executeCode(code, context, options)
    } catch (error) {
      throw new Error(`Template execution error: ${error instanceof Error ? error.message : String(error)}`)
    }

    return output
  }
}

/**
 * Compile array of AST nodes
 */
function compileNodes(nodes: ASTNode[], options: TemplateOptions): string {
  const parts = nodes.map((node) => compileNode(node, options))
  if (parts.length === 0) return '""'
  if (parts.length === 1) return parts[0]!
  return parts.join(' + ')
}

/**
 * Compile a single AST node
 */
function compileNode(node: ASTNode, options: TemplateOptions): string {
  switch (node.type) {
    case 'text':
      return JSON.stringify(node.value)

    case 'variable': {
      const varCode = `resolveValue(context, ${JSON.stringify(node.name)})`
      if (node.escaped && !options.noEscape) {
        return `escapeHTML(String(${varCode} ?? ''))`
      }
      return `String(${varCode} ?? '')`
    }

    case 'unescaped': {
      const varCode = `resolveValue(context, ${JSON.stringify(node.name)})`
      return `String(${varCode} ?? '')`
    }

    case 'comment':
      return '""'

    // BUG-1 fix: render partial against current context instead of returning raw string
    case 'partial': {
      return `renderPartial(${JSON.stringify(node.name)}, context)`
    }

    case 'section': {
      const value = `resolveValue(context, ${JSON.stringify(node.name)})`

      // Generate child rendering function that takes a context
      const renderChildren = (contextVar: string) => {
        const childCode = node.children.map(child => {
          // Replace context with the new context variable in child nodes
          return compileNodeWithContext(child, contextVar, options)
        })
        if (childCode.length === 0) return '""'
        if (childCode.length === 1) return childCode[0]!
        return childCode.join(' + ')
      }

      return `(function() {
        const value = ${value};
        if (typeof value === 'function') {
          return String(value(context) ?? '');
        }
        if (isFalsy(value)) return '';

        if (isArrayLike(value)) {
          return value.map(item => {
            const newContext = typeof item === 'object' ? { ...context, ...item } : { ...context, '.': item };
            return ${renderChildren('newContext')};
          }).join('');
        }

        if (typeof value === 'object') {
          const newContext = { ...context, ...value };
          return ${renderChildren('newContext')};
        }

        return ${renderChildren('context')};
      })()`
    }

    case 'inverted': {
      const value = `resolveValue(context, ${JSON.stringify(node.name)})`
      const childrenCode = compileNodes(node.children, options)

      return `(function() {
        const value = ${value};
        if (isFalsy(value)) {
          return ${childrenCode};
        }
        return '';
      })()`
    }

    default:
      return '""'
  }
}

/**
 * Execute generated code
 */
function executeCode(
  code: string,
  context: TemplateContext,
  options: TemplateOptions
): string {
  // BUG-1 fix: renderPartial compiles and executes the partial template with current context
  const renderPartial = (name: string, ctx: TemplateContext): string => {
    const partialStr = typeof options.partials === 'function'
      ? options.partials(name)
      : options.partials?.[name]
    if (!partialStr) return ''
    const tokens = tokenize(partialStr)
    const ast = parse(tokens)
    const compiled = compile(ast, options)
    return compiled(ctx)
  }

  // BUG-2 fix: helpers are now accessible in generated code scope
  const helpers = options.helpers ?? {}

  // resolveValue checks context first, then helpers
  const resolveValue = (ctx: TemplateContext, name: string): unknown => {
    const ctxValue = getValue(ctx, name)
    if (ctxValue !== undefined && ctxValue !== null) return ctxValue
    const helper = helpers[name]
    if (typeof helper === 'function') return helper(ctx)
    return ctxValue
  }

  // Create function with all helpers in scope
  const fn = new Function(
    'context',
    'escapeHTML',
    'getValue',
    'resolveValue',
    'isFalsy',
    'isArrayLike',
    'renderPartial',
    `return ${code};`
  )

  return fn(context, escapeHTML, getValue, resolveValue, isFalsy, isArrayLike, renderPartial)
}

/**
 * Compile a node with a specific context variable name
 */
function compileNodeWithContext(node: ASTNode, contextVar: string, options: TemplateOptions): string {
  switch (node.type) {
    case 'text':
      return JSON.stringify(node.value)

    case 'variable': {
      const varCode = `resolveValue(${contextVar}, ${JSON.stringify(node.name)})`
      if (node.escaped && !options.noEscape) {
        return `escapeHTML(String(${varCode} ?? ''))`
      }
      return `String(${varCode} ?? '')`
    }

    case 'unescaped': {
      const varCode = `resolveValue(${contextVar}, ${JSON.stringify(node.name)})`
      return `String(${varCode} ?? '')`
    }

    case 'comment':
      return '""'

    // BUG-1 fix: pass contextVar to partial rendering
    case 'partial': {
      return `renderPartial(${JSON.stringify(node.name)}, ${contextVar})`
    }

    // BUG-3 fix: handle nested sections with the derived contextVar instead of falling back to root context
    case 'section': {
      const sectionNode = node as SectionNode
      const value = `resolveValue(${contextVar}, ${JSON.stringify(sectionNode.name)})`

      const renderChildren = (innerContextVar: string) => {
        const childCode = sectionNode.children.map(child => {
          return compileNodeWithContext(child, innerContextVar, options)
        })
        if (childCode.length === 0) return '""'
        if (childCode.length === 1) return childCode[0]!
        return childCode.join(' + ')
      }

      return `(function() {
        const value = ${value};
        if (typeof value === 'function') {
          return String(value(${contextVar}) ?? '');
        }
        if (isFalsy(value)) return '';

        if (isArrayLike(value)) {
          return value.map(item => {
            const newContext = typeof item === 'object' ? { ...${contextVar}, ...item } : { ...${contextVar}, '.': item };
            return ${renderChildren('newContext')};
          }).join('');
        }

        if (typeof value === 'object') {
          const newContext = { ...${contextVar}, ...value };
          return ${renderChildren('newContext')};
        }

        return ${renderChildren(contextVar)};
      })()`
    }

    default:
      return compileNode(node, options)
  }
}
