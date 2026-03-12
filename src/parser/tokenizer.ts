/**
 * Template Tokenizer
 * 
 * Converts template strings to token stream
 */

import { Token, TokenType, TemplateError } from '../types.js'

/**
 * Tokenize a template string
 * 
 * @param template - Template string to tokenize
 * @returns Array of tokens
 * 
 * @example
 * ```ts
 * const tokens = tokenize('Hello {{name}}!')
 * // [
 * //   { type: 'TEXT', value: 'Hello ', line: 1, col: 1 },
 * //   { type: 'VARIABLE', value: 'name', line: 1, col: 7 },
 * //   { type: 'TEXT', value: '!', line: 1, col: 15 }
 * // ]
 * ```
 */
export function tokenize(template: string): Token[] {
  const tokens: Token[] = []
  let pos = 0
  let line = 1
  let col = 1

  while (pos < template.length) {
    // Check for tag opening
    if (template[pos] === '{' && template[pos + 1] === '{') {
      // Check for triple braces (unescaped)
      if (template[pos + 2] === '{') {
        const result = readTripleBraceTag(template, pos, line, col)
        tokens.push(result.token)
        pos = result.pos
        line = result.line
        col = result.col
      } else {
        const result = readDoubleBraceTag(template, pos, line, col)
        tokens.push(result.token)
        pos = result.pos
        line = result.line
        col = result.col
      }
    } else {
      // Read text until next tag
      const result = readText(template, pos, line, col)
      if (result.token.value) {
        tokens.push(result.token)
      }
      pos = result.pos
      line = result.line
      col = result.col
    }
  }

  return tokens
}

/**
 * Read plain text until next tag
 */
function readText(
  template: string,
  start: number,
  startLine: number,
  startCol: number
): { token: Token; pos: number; line: number; col: number } {
  let pos = start
  let line = startLine
  let col = startCol
  let text = ''

  while (pos < template.length) {
    // Stop at tag opening
    if (template[pos] === '{' && template[pos + 1] === '{') {
      break
    }

    const char = template[pos]!
    text += char
    pos++

    if (char === '\n') {
      line++
      col = 1
    } else {
      col++
    }
  }

  return {
    token: {
      type: TokenType.TEXT,
      value: text,
      line: startLine,
      col: startCol,
    },
    pos,
    line,
    col,
  }
}

/**
 * Read double brace tag {{...}}
 */
function readDoubleBraceTag(
  template: string,
  start: number,
  startLine: number,
  startCol: number
): { token: Token; pos: number; line: number; col: number } {
  let pos = start + 2 // Skip {{
  let col = startCol + 2

  // Find closing }}
  const closePos = template.indexOf('}}', pos)
  if (closePos === -1) {
    throw new TemplateError('Unclosed tag', startLine, startCol)
  }

  const content = template.slice(pos, closePos).trim()
  pos = closePos + 2
  col = startCol + (closePos - start) + 2

  // Determine tag type
  const firstChar = content[0]
  let type: TokenType
  let value: string

  if (firstChar === '#') {
    type = TokenType.SECTION_OPEN
    value = content.slice(1).trim()
  } else if (firstChar === '/') {
    type = TokenType.SECTION_CLOSE
    value = content.slice(1).trim()
  } else if (firstChar === '^') {
    type = TokenType.INVERTED_OPEN
    value = content.slice(1).trim()
  } else if (firstChar === '!') {
    type = TokenType.COMMENT
    value = content.slice(1).trim()
  } else if (firstChar === '>') {
    type = TokenType.PARTIAL
    value = content.slice(1).trim()
  } else if (firstChar === '&') {
    type = TokenType.UNESCAPED
    value = content.slice(1).trim()
  } else {
    type = TokenType.VARIABLE
    value = content
  }

  return {
    token: {
      type,
      value,
      line: startLine,
      col: startCol,
    },
    pos,
    line: startLine,
    col,
  }
}

/**
 * Read triple brace tag {{{...}}}
 */
function readTripleBraceTag(
  template: string,
  start: number,
  startLine: number,
  startCol: number
): { token: Token; pos: number; line: number; col: number } {
  let pos = start + 3 // Skip {{{

  // Find closing }}}
  const closePos = template.indexOf('}}}', pos)
  if (closePos === -1) {
    throw new TemplateError('Unclosed triple brace tag', startLine, startCol)
  }

  const content = template.slice(pos, closePos).trim()
  pos = closePos + 3
  const col = startCol + (closePos - start) + 3

  return {
    token: {
      type: TokenType.UNESCAPED,
      value: content,
      line: startLine,
      col: startCol,
    },
    pos,
    line: startLine,
    col,
  }
}
