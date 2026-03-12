/**
 * Type definitions for @lpm.dev/neo.template
 */

/**
 * Token types for template parsing
 */
export enum TokenType {
  TEXT = 'TEXT',                    // Plain text
  VARIABLE = 'VARIABLE',            // {{name}}
  SECTION_OPEN = 'SECTION_OPEN',    // {{#section}}
  SECTION_CLOSE = 'SECTION_CLOSE',  // {{/section}}
  INVERTED_OPEN = 'INVERTED_OPEN',  // {{^section}}
  COMMENT = 'COMMENT',              // {{! comment}}
  PARTIAL = 'PARTIAL',              // {{> partial}}
  UNESCAPED = 'UNESCAPED',          // {{{raw}}} or {{&raw}}
}

/**
 * Token interface
 */
export interface Token {
  type: TokenType
  value: string
  line: number
  col: number
}

/**
 * AST Node types
 */
export type ASTNode =
  | TextNode
  | VariableNode
  | SectionNode
  | InvertedNode
  | CommentNode
  | PartialNode
  | UnescapedNode

/**
 * Text node (plain text)
 */
export interface TextNode {
  type: 'text'
  value: string
}

/**
 * Variable node ({{name}})
 */
export interface VariableNode {
  type: 'variable'
  name: string
  escaped: boolean
}

/**
 * Section node ({{#section}}...{{/section}})
 */
export interface SectionNode {
  type: 'section'
  name: string
  children: ASTNode[]
  inverted: boolean
}

/**
 * Inverted section node ({{^section}}...{{/section}})
 */
export interface InvertedNode {
  type: 'inverted'
  name: string
  children: ASTNode[]
}

/**
 * Comment node ({{! comment}})
 */
export interface CommentNode {
  type: 'comment'
  value: string
}

/**
 * Partial node ({{> partial}})
 */
export interface PartialNode {
  type: 'partial'
  name: string
  indent: string
}

/**
 * Unescaped node ({{{raw}}} or {{&raw}})
 */
export interface UnescapedNode {
  type: 'unescaped'
  name: string
}

/**
 * Template context data
 */
export type TemplateContext = Record<string, unknown>

/**
 * Compiled template function
 */
export type CompiledTemplate = (context: TemplateContext) => string

/**
 * Helper function type
 */
export type HelperFunction = (context: TemplateContext, ...args: unknown[]) => unknown

/**
 * Partial resolver function
 */
export type PartialResolver = (name: string) => string | undefined

/**
 * Template options
 */
export interface TemplateOptions {
  helpers?: Record<string, HelperFunction>
  partials?: Record<string, string> | PartialResolver
  noEscape?: boolean
}

/**
 * Parser error
 */
export class TemplateError extends Error {
  constructor(
    message: string,
    public line: number,
    public col: number
  ) {
    super(`${message} at line ${line}, column ${col}`)
    this.name = 'TemplateError'
  }
}
