/**
 * Template Parser
 * 
 * Converts token stream to AST
 */

import {
  Token,
  TokenType,
  ASTNode,
  TextNode,
  VariableNode,
  SectionNode,
  InvertedNode,
  CommentNode,
  PartialNode,
  UnescapedNode,
  TemplateError,
} from '../types.js'

/**
 * Parse tokens into an AST
 * 
 * @param tokens - Array of tokens from tokenizer
 * @returns Array of AST nodes
 * 
 * @example
 * ```ts
 * const tokens = tokenize('Hello {{name}}!')
 * const ast = parse(tokens)
 * // [
 * //   { type: 'text', value: 'Hello ' },
 * //   { type: 'variable', name: 'name', escaped: true },
 * //   { type: 'text', value: '!' }
 * // ]
 * ```
 */
export function parse(tokens: Token[]): ASTNode[] {
  const ast: ASTNode[] = []
  let pos = 0

  while (pos < tokens.length) {
    const result = parseNode(tokens, pos)
    ast.push(result.node)
    pos = result.pos
  }

  return ast
}

/**
 * Parse a single node
 */
function parseNode(
  tokens: Token[],
  start: number
): { node: ASTNode; pos: number } {
  const token = tokens[start]
  
  if (!token) {
    throw new Error('Unexpected end of tokens')
  }

  switch (token.type) {
    case TokenType.TEXT:
      return {
        node: {
          type: 'text',
          value: token.value,
        } as TextNode,
        pos: start + 1,
      }

    case TokenType.VARIABLE:
      return {
        node: {
          type: 'variable',
          name: token.value,
          escaped: true,
        } as VariableNode,
        pos: start + 1,
      }

    case TokenType.UNESCAPED:
      return {
        node: {
          type: 'unescaped',
          name: token.value,
        } as UnescapedNode,
        pos: start + 1,
      }

    case TokenType.COMMENT:
      return {
        node: {
          type: 'comment',
          value: token.value,
        } as CommentNode,
        pos: start + 1,
      }

    case TokenType.PARTIAL:
      return {
        node: {
          type: 'partial',
          name: token.value,
          indent: '',
        } as PartialNode,
        pos: start + 1,
      }

    case TokenType.SECTION_OPEN:
      return parseSection(tokens, start, false)

    case TokenType.INVERTED_OPEN:
      return parseSection(tokens, start, true)

    case TokenType.SECTION_CLOSE:
      throw new TemplateError(
        `Unexpected closing tag {{/${token.value}}}`,
        token.line,
        token.col
      )

    default:
      throw new TemplateError(
        `Unknown token type: ${token.type}`,
        token.line,
        token.col
      )
  }
}

/**
 * Parse a section ({{#section}}...{{/section}})
 */
function parseSection(
  tokens: Token[],
  start: number,
  inverted: boolean
): { node: ASTNode; pos: number } {
  const openToken = tokens[start]!
  const sectionName = openToken.value
  const children: ASTNode[] = []
  let pos = start + 1

  // Parse children until closing tag
  while (pos < tokens.length) {
    const token = tokens[pos]

    if (!token) {
      throw new TemplateError(
        `Unclosed section {{#${sectionName}}}`,
        openToken.line,
        openToken.col
      )
    }

    // Check for closing tag
    if (token.type === TokenType.SECTION_CLOSE) {
      if (token.value !== sectionName) {
        throw new TemplateError(
          `Mismatched section tags: expected {{/${sectionName}}}, got {{/${token.value}}}`,
          token.line,
          token.col
        )
      }

      // Found closing tag
      return {
        node: {
          type: inverted ? 'inverted' : 'section',
          name: sectionName,
          children,
          inverted,
        } as SectionNode | InvertedNode,
        pos: pos + 1,
      }
    }

    // Parse child node
    const result = parseNode(tokens, pos)
    children.push(result.node)
    pos = result.pos
  }

  // Reached end without finding closing tag
  throw new TemplateError(
    `Unclosed section {{#${sectionName}}}`,
    openToken.line,
    openToken.col
  )
}
