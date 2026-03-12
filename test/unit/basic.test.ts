/**
 * Basic smoke tests for neo.template
 */

import { describe, it, expect } from 'vitest'
import { render, compile, tokenize, parse } from '../../src/index.js'

describe('Basic Template Rendering', () => {
  it('should render simple text', () => {
    const result = render('Hello World')
    expect(result).toBe('Hello World')
  })

  it('should render a variable', () => {
    const result = render('Hello {{name}}', { name: 'John' })
    expect(result).toBe('Hello John')
  })

  it('should escape HTML in variables by default', () => {
    const result = render('{{html}}', { html: '<script>alert()</script>' })
    // Forward slashes are also escaped for XSS protection
    expect(result).toBe('&lt;script&gt;alert()&lt;&#x2F;script&gt;')
  })

  it('should render unescaped HTML with triple braces', () => {
    const result = render('{{{html}}}', { html: '<strong>Bold</strong>' })
    expect(result).toBe('<strong>Bold</strong>')
  })

  it('should render sections with arrays', () => {
    const result = render('{{#items}}{{.}}{{/items}}', {
      items: [1, 2, 3],
    })
    expect(result).toBe('123')
  })

  it('should render sections with objects', () => {
    const result = render('{{#user}}Hello {{name}}{{/user}}', {
      user: { name: 'John' },
    })
    expect(result).toBe('Hello John')
  })

  it('should render inverted sections', () => {
    const result = render('{{^items}}No items{{/items}}', {
      items: [],
    })
    expect(result).toBe('No items')
  })

  it('should skip comments', () => {
    const result = render('Hello{{! this is a comment}} World')
    expect(result).toBe('Hello World')
  })
})

describe('Compiled Templates', () => {
  it('should compile and reuse template', () => {
    const template = compile('Hello {{name}}!')
    
    expect(template({ name: 'John' })).toBe('Hello John!')
    expect(template({ name: 'Jane' })).toBe('Hello Jane!')
    expect(template({ name: 'Bob' })).toBe('Hello Bob!')
  })

  it('should handle missing variables gracefully', () => {
    const template = compile('Hello {{name}}!')
    expect(template({})).toBe('Hello !')
  })
})

describe('Tokenizer', () => {
  it('should tokenize simple template', () => {
    const tokens = tokenize('Hello {{name}}')
    expect(tokens).toHaveLength(2)
    expect(tokens[0]?.type).toBe('TEXT')
    expect(tokens[0]?.value).toBe('Hello ')
    expect(tokens[1]?.type).toBe('VARIABLE')
    expect(tokens[1]?.value).toBe('name')
  })

  it('should tokenize section tags', () => {
    const tokens = tokenize('{{#section}}content{{/section}}')
    expect(tokens).toHaveLength(3)
    expect(tokens[0]?.type).toBe('SECTION_OPEN')
    expect(tokens[1]?.type).toBe('TEXT')
    expect(tokens[2]?.type).toBe('SECTION_CLOSE')
  })
})

describe('Parser', () => {
  it('should parse simple template', () => {
    const tokens = tokenize('Hello {{name}}')
    const ast = parse(tokens)
    expect(ast).toHaveLength(2)
    expect(ast[0]?.type).toBe('text')
    expect(ast[1]?.type).toBe('variable')
  })

  it('should parse nested sections', () => {
    const tokens = tokenize('{{#section}}{{#nested}}content{{/nested}}{{/section}}')
    const ast = parse(tokens)
    expect(ast).toHaveLength(1)
    expect(ast[0]?.type).toBe('section')
  })
})
