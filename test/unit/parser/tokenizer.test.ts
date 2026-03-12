/**
 * Comprehensive Tokenizer Tests  
 */

import { describe, it, expect } from 'vitest'
import { tokenize } from '../../../src/parser/tokenizer.js'
import { TokenType } from '../../../src/types.js'

describe('Tokenizer - Variables', () => {
  it('should tokenize simple variable', () => {
    const tokens = tokenize('{{name}}')
    expect(tokens).toHaveLength(1)
    expect(tokens[0]).toMatchObject({
      type: TokenType.VARIABLE,
      value: 'name',
    })
  })

  it('should tokenize variable with whitespace', () => {
    const tokens = tokenize('{{  name  }}')
    expect(tokens).toHaveLength(1)
    expect(tokens[0]?.value).toBe('name')
  })

  it('should tokenize dotted variable path', () => {
    const tokens = tokenize('{{user.name}}')
    expect(tokens).toHaveLength(1)
    expect(tokens[0]?.value).toBe('user.name')
  })

  it('should tokenize multiple variables', () => {
    const tokens = tokenize('{{first}} {{last}}')
    expect(tokens).toHaveLength(3)
    expect(tokens[0]?.type).toBe(TokenType.VARIABLE)
    expect(tokens[1]?.type).toBe(TokenType.TEXT)
    expect(tokens[2]?.type).toBe(TokenType.VARIABLE)
  })

  it('should tokenize current context dot', () => {
    const tokens = tokenize('{{.}}')
    expect(tokens).toHaveLength(1)
    expect(tokens[0]?.value).toBe('.')
  })
})

describe('Tokenizer - Unescaped Variables', () => {
  it('should tokenize triple brace unescaped', () => {
    const tokens = tokenize('{{{html}}}')
    expect(tokens).toHaveLength(1)
    expect(tokens[0]).toMatchObject({
      type: TokenType.UNESCAPED,
      value: 'html',
    })
  })

  it('should tokenize ampersand unescaped', () => {
    const tokens = tokenize('{{&html}}')
    expect(tokens).toHaveLength(1)
    expect(tokens[0]).toMatchObject({
      type: TokenType.UNESCAPED,
      value: 'html',
    })
  })

  it('should handle whitespace in triple braces', () => {
    const tokens = tokenize('{{{  html  }}}')
    expect(tokens).toHaveLength(1)
    expect(tokens[0]?.value).toBe('html')
  })
})

describe('Tokenizer - Sections', () => {
  it('should tokenize section open', () => {
    const tokens = tokenize('{{#section}}')
    expect(tokens).toHaveLength(1)
    expect(tokens[0]).toMatchObject({
      type: TokenType.SECTION_OPEN,
      value: 'section',
    })
  })

  it('should tokenize section close', () => {
    const tokens = tokenize('{{/section}}')
    expect(tokens).toHaveLength(1)
    expect(tokens[0]).toMatchObject({
      type: TokenType.SECTION_CLOSE,
      value: 'section',
    })
  })

  it('should tokenize complete section', () => {
    const tokens = tokenize('{{#items}}content{{/items}}')
    expect(tokens).toHaveLength(3)
    expect(tokens[0]?.type).toBe(TokenType.SECTION_OPEN)
    expect(tokens[1]?.type).toBe(TokenType.TEXT)
    expect(tokens[2]?.type).toBe(TokenType.SECTION_CLOSE)
  })

  it('should tokenize nested sections', () => {
    const tokens = tokenize('{{#outer}}{{#inner}}{{/inner}}{{/outer}}')
    expect(tokens).toHaveLength(4)
    expect(tokens[0]?.type).toBe(TokenType.SECTION_OPEN)
    expect(tokens[1]?.type).toBe(TokenType.SECTION_OPEN)
    expect(tokens[2]?.type).toBe(TokenType.SECTION_CLOSE)
    expect(tokens[3]?.type).toBe(TokenType.SECTION_CLOSE)
  })

  it('should handle dotted section names', () => {
    const tokens = tokenize('{{#user.profile}}{{/user.profile}}')
    expect(tokens).toHaveLength(2)
    expect(tokens[0]?.value).toBe('user.profile')
    expect(tokens[1]?.value).toBe('user.profile')
  })
})

describe('Tokenizer - Inverted Sections', () => {
  it('should tokenize inverted section open', () => {
    const tokens = tokenize('{{^section}}')
    expect(tokens).toHaveLength(1)
    expect(tokens[0]).toMatchObject({
      type: TokenType.INVERTED_OPEN,
      value: 'section',
    })
  })

  it('should tokenize complete inverted section', () => {
    const tokens = tokenize('{{^empty}}No items{{/empty}}')
    expect(tokens).toHaveLength(3)
    expect(tokens[0]?.type).toBe(TokenType.INVERTED_OPEN)
    expect(tokens[1]?.type).toBe(TokenType.TEXT)
    expect(tokens[2]?.type).toBe(TokenType.SECTION_CLOSE)
  })
})

describe('Tokenizer - Comments', () => {
  it('should tokenize comment', () => {
    const tokens = tokenize('{{! this is a comment}}')
    expect(tokens).toHaveLength(1)
    expect(tokens[0]).toMatchObject({
      type: TokenType.COMMENT,
      value: 'this is a comment',
    })
  })

  it('should tokenize multi-line comment', () => {
    const tokens = tokenize('{{! line1\nline2 }}')
    expect(tokens).toHaveLength(1)
    expect(tokens[0]?.type).toBe(TokenType.COMMENT)
  })

  it('should tokenize comment with special characters', () => {
    const tokens = tokenize('{{! <>&"\' }}')
    expect(tokens).toHaveLength(1)
    expect(tokens[0]?.value).toBe('<>&"\'')
  })
})

describe('Tokenizer - Partials', () => {
  it('should tokenize partial', () => {
    const tokens = tokenize('{{> header}}')
    expect(tokens).toHaveLength(1)
    expect(tokens[0]).toMatchObject({
      type: TokenType.PARTIAL,
      value: 'header',
    })
  })

  it('should tokenize partial with path', () => {
    const tokens = tokenize('{{> partials/header}}')
    expect(tokens).toHaveLength(1)
    expect(tokens[0]?.value).toBe('partials/header')
  })
})

describe('Tokenizer - Text Content', () => {
  it('should tokenize plain text', () => {
    const tokens = tokenize('Hello World')
    expect(tokens).toHaveLength(1)
    expect(tokens[0]).toMatchObject({
      type: TokenType.TEXT,
      value: 'Hello World',
    })
  })

  it('should handle empty string', () => {
    const tokens = tokenize('')
    expect(tokens).toHaveLength(0)
  })

  it('should preserve whitespace in text', () => {
    const tokens = tokenize('  Hello  \n  World  ')
    expect(tokens).toHaveLength(1)
    expect(tokens[0]?.value).toBe('  Hello  \n  World  ')
  })

  it('should handle special characters in text', () => {
    const tokens = tokenize('Price: $100 & tax')
    expect(tokens).toHaveLength(1)
    expect(tokens[0]?.value).toBe('Price: $100 & tax')
  })

  it('should handle single opening brace', () => {
    const tokens = tokenize('Single { brace')
    expect(tokens).toHaveLength(1)
    expect(tokens[0]?.value).toBe('Single { brace')
  })
})

describe('Tokenizer - Mixed Content', () => {
  it('should tokenize text and variables mixed', () => {
    const tokens = tokenize('Hello {{name}}, welcome!')
    expect(tokens).toHaveLength(3)
    expect(tokens[0]?.type).toBe(TokenType.TEXT)
    expect(tokens[1]?.type).toBe(TokenType.VARIABLE)
    expect(tokens[2]?.type).toBe(TokenType.TEXT)
  })

  it('should tokenize complex template', () => {
    const template = '{{#users}}<li>{{name}} - {{email}}</li>{{/users}}'
    const tokens = tokenize(template)
    expect(tokens).toHaveLength(7)
    expect(tokens[0]?.type).toBe(TokenType.SECTION_OPEN)
    expect(tokens[1]?.type).toBe(TokenType.TEXT)
    expect(tokens[2]?.type).toBe(TokenType.VARIABLE)
    expect(tokens[3]?.type).toBe(TokenType.TEXT)
    expect(tokens[4]?.type).toBe(TokenType.VARIABLE)
    expect(tokens[5]?.type).toBe(TokenType.TEXT)
    expect(tokens[6]?.type).toBe(TokenType.SECTION_CLOSE)
  })

  it('should handle consecutive tags', () => {
    const tokens = tokenize('{{first}}{{second}}{{third}}')
    expect(tokens).toHaveLength(3)
    expect(tokens.every(t => t.type === TokenType.VARIABLE)).toBe(true)
  })
})

describe('Tokenizer - Line and Column Tracking', () => {
  it('should track line numbers', () => {
    const tokens = tokenize('line1\n{{var}}\nline3')
    expect(tokens[0]?.line).toBe(1)
    expect(tokens[1]?.line).toBe(2)
    expect(tokens[2]?.line).toBe(2)
  })

  it('should track column numbers', () => {
    const tokens = tokenize('Hello {{name}}')
    expect(tokens[0]?.col).toBe(1)
    expect(tokens[1]?.col).toBe(7)
  })
})

describe('Tokenizer - Edge Cases', () => {
  it('should handle only whitespace', () => {
    const tokens = tokenize('   \n   \t   ')
    expect(tokens).toHaveLength(1)
    expect(tokens[0]?.type).toBe(TokenType.TEXT)
  })

  it('should handle multiple newlines', () => {
    const tokens = tokenize('\n\n\n')
    expect(tokens).toHaveLength(1)
    expect(tokens[0]?.value).toBe('\n\n\n')
  })

  it('should handle tag at start', () => {
    const tokens = tokenize('{{var}} text')
    expect(tokens).toHaveLength(2)
    expect(tokens[0]?.type).toBe(TokenType.VARIABLE)
  })

  it('should handle tag at end', () => {
    const tokens = tokenize('text {{var}}')
    expect(tokens).toHaveLength(2)
    expect(tokens[1]?.type).toBe(TokenType.VARIABLE)
  })
})

describe('Tokenizer - Error Cases', () => {
  it('should throw on unclosed double brace tag', () => {
    expect(() => tokenize('{{name')).toThrow('Unclosed tag')
  })

  it('should throw on unclosed triple brace tag', () => {
    expect(() => tokenize('{{{html')).toThrow('Unclosed triple brace tag')
  })

  it('should throw on unclosed triple brace (partial close)', () => {
    expect(() => tokenize('{{{html}}')).toThrow('Unclosed triple brace tag')
  })
})
