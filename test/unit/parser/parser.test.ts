/**
 * Comprehensive Parser Tests
 */

import { describe, it, expect } from 'vitest'
import { tokenize } from '../../../src/parser/tokenizer.js'
import { parse } from '../../../src/parser/parser.js'
import { TemplateError } from '../../../src/types.js'

describe('Parser - Basic Nodes', () => {
  it('should parse text node', () => {
    const tokens = tokenize('Hello World')
    const ast = parse(tokens)
    expect(ast).toHaveLength(1)
    expect(ast[0]).toMatchObject({
      type: 'text',
      value: 'Hello World',
    })
  })

  it('should parse variable node', () => {
    const tokens = tokenize('{{name}}')
    const ast = parse(tokens)
    expect(ast).toHaveLength(1)
    expect(ast[0]).toMatchObject({
      type: 'variable',
      name: 'name',
      escaped: true,
    })
  })

  it('should parse unescaped node', () => {
    const tokens = tokenize('{{{html}}}')
    const ast = parse(tokens)
    expect(ast).toHaveLength(1)
    expect(ast[0]).toMatchObject({
      type: 'unescaped',
      name: 'html',
    })
  })

  it('should parse comment node', () => {
    const tokens = tokenize('{{! comment}}')
    const ast = parse(tokens)
    expect(ast).toHaveLength(1)
    expect(ast[0]).toMatchObject({
      type: 'comment',
      value: 'comment',
    })
  })

  it('should parse partial node', () => {
    const tokens = tokenize('{{> header}}')
    const ast = parse(tokens)
    expect(ast).toHaveLength(1)
    expect(ast[0]).toMatchObject({
      type: 'partial',
      name: 'header',
    })
  })
})

describe('Parser - Sections', () => {
  it('should parse simple section', () => {
    const tokens = tokenize('{{#section}}content{{/section}}')
    const ast = parse(tokens)
    expect(ast).toHaveLength(1)
    expect(ast[0]).toMatchObject({
      type: 'section',
      name: 'section',
      inverted: false,
    })
    expect(ast[0]?.type === 'section' && ast[0].children).toHaveLength(1)
  })

  it('should parse section with variables', () => {
    const tokens = tokenize('{{#user}}Hello {{name}}{{/user}}')
    const ast = parse(tokens)
    expect(ast).toHaveLength(1)
    const section = ast[0]
    expect(section?.type).toBe('section')
    if (section?.type === 'section') {
      expect(section.children).toHaveLength(2)
      expect(section.children[0]?.type).toBe('text')
      expect(section.children[1]?.type).toBe('variable')
    }
  })

  it('should parse nested sections', () => {
    const tokens = tokenize('{{#outer}}{{#inner}}content{{/inner}}{{/outer}}')
    const ast = parse(tokens)
    expect(ast).toHaveLength(1)
    const outer = ast[0]
    expect(outer?.type).toBe('section')
    if (outer?.type === 'section') {
      expect(outer.children).toHaveLength(1)
      expect(outer.children[0]?.type).toBe('section')
    }
  })

  it('should parse deeply nested sections', () => {
    const tokens = tokenize('{{#a}}{{#b}}{{#c}}{{#d}}deep{{/d}}{{/c}}{{/b}}{{/a}}')
    const ast = parse(tokens)
    expect(ast).toHaveLength(1)
    
    let current: any = ast[0]
    expect(current?.type).toBe('section')
    expect(current?.name).toBe('a')
    
    current = current?.children[0]
    expect(current?.type).toBe('section')
    expect(current?.name).toBe('b')
    
    current = current?.children[0]
    expect(current?.type).toBe('section')
    expect(current?.name).toBe('c')
    
    current = current?.children[0]
    expect(current?.type).toBe('section')
    expect(current?.name).toBe('d')
  })

  it('should parse section with dotted name', () => {
    const tokens = tokenize('{{#user.profile}}{{name}}{{/user.profile}}')
    const ast = parse(tokens)
    expect(ast).toHaveLength(1)
    expect(ast[0]).toMatchObject({
      type: 'section',
      name: 'user.profile',
    })
  })

  it('should parse empty section', () => {
    const tokens = tokenize('{{#section}}{{/section}}')
    const ast = parse(tokens)
    expect(ast).toHaveLength(1)
    const section = ast[0]
    if (section?.type === 'section') {
      expect(section.children).toHaveLength(0)
    }
  })
})

describe('Parser - Inverted Sections', () => {
  it('should parse inverted section', () => {
    const tokens = tokenize('{{^empty}}No items{{/empty}}')
    const ast = parse(tokens)
    expect(ast).toHaveLength(1)
    expect(ast[0]).toMatchObject({
      type: 'inverted',
      name: 'empty',
    })
  })

  it('should parse inverted with variables', () => {
    const tokens = tokenize('{{^items}}No {{type}} found{{/items}}')
    const ast = parse(tokens)
    const inverted = ast[0]
    expect(inverted?.type).toBe('inverted')
    if (inverted?.type === 'inverted') {
      expect(inverted.children).toHaveLength(3)
    }
  })

  it('should parse nested inverted sections', () => {
    const tokens = tokenize('{{^a}}{{^b}}content{{/b}}{{/a}}')
    const ast = parse(tokens)
    const outer = ast[0]
    expect(outer?.type).toBe('inverted')
    if (outer?.type === 'inverted') {
      expect(outer.children[0]?.type).toBe('inverted')
    }
  })
})

describe('Parser - Mixed Content', () => {
  it('should parse text and variables', () => {
    const tokens = tokenize('Hello {{name}}, you are {{age}} years old')
    const ast = parse(tokens)
    expect(ast).toHaveLength(5)
    expect(ast[0]?.type).toBe('text')
    expect(ast[1]?.type).toBe('variable')
    expect(ast[2]?.type).toBe('text')
    expect(ast[3]?.type).toBe('variable')
    expect(ast[4]?.type).toBe('text')
  })

  it('should parse complex template', () => {
    const template = `
      <h1>{{title}}</h1>
      {{#items}}
        <li>{{name}}: {{price}}</li>
      {{/items}}
      {{^items}}
        <p>No items</p>
      {{/items}}
    `
    const tokens = tokenize(template)
    const ast = parse(tokens)
    expect(ast.length).toBeGreaterThan(0)
  })

  it('should parse sections with comments', () => {
    const tokens = tokenize('{{#section}}{{! comment}}content{{/section}}')
    const ast = parse(tokens)
    const section = ast[0]
    if (section?.type === 'section') {
      expect(section.children).toHaveLength(2)
      expect(section.children[0]?.type).toBe('comment')
      expect(section.children[1]?.type).toBe('text')
    }
  })

  it('should parse consecutive sections', () => {
    const tokens = tokenize('{{#a}}A{{/a}}{{#b}}B{{/b}}{{#c}}C{{/c}}')
    const ast = parse(tokens)
    expect(ast).toHaveLength(3)
    expect(ast.every(node => node.type === 'section')).toBe(true)
  })
})

describe('Parser - Error Handling', () => {
  it('should throw on unexpected closing tag', () => {
    const tokens = tokenize('{{/section}}')
    expect(() => parse(tokens)).toThrow(TemplateError)
    expect(() => parse(tokens)).toThrow('Unexpected closing tag')
  })

  it('should throw on unclosed section', () => {
    const tokens = tokenize('{{#section}}content')
    expect(() => parse(tokens)).toThrow(TemplateError)
    expect(() => parse(tokens)).toThrow('Unclosed section')
  })

  it('should throw on mismatched section tags', () => {
    const tokens = tokenize('{{#section}}content{{/other}}')
    expect(() => parse(tokens)).toThrow(TemplateError)
    expect(() => parse(tokens)).toThrow('Mismatched section tags')
  })

  it('should throw on nested mismatched tags', () => {
    const tokens = tokenize('{{#outer}}{{#inner}}content{{/outer}}{{/inner}}')
    expect(() => parse(tokens)).toThrow(TemplateError)
  })

  it('should throw on unclosed nested section', () => {
    const tokens = tokenize('{{#outer}}{{#inner}}content{{/outer}}')
    expect(() => parse(tokens)).toThrow(TemplateError)
  })
})

describe('Parser - Edge Cases', () => {
  it('should parse empty template', () => {
    const tokens = tokenize('')
    const ast = parse(tokens)
    expect(ast).toHaveLength(0)
  })

  it('should parse only whitespace', () => {
    const tokens = tokenize('   \n   ')
    const ast = parse(tokens)
    expect(ast).toHaveLength(1)
    expect(ast[0]?.type).toBe('text')
  })

  it('should parse only comments', () => {
    const tokens = tokenize('{{! comment1 }}{{! comment2 }}')
    const ast = parse(tokens)
    expect(ast).toHaveLength(2)
    expect(ast.every(node => node.type === 'comment')).toBe(true)
  })

  it('should preserve text whitespace', () => {
    const tokens = tokenize('  Hello  \n  World  ')
    const ast = parse(tokens)
    expect(ast[0]).toMatchObject({
      type: 'text',
      value: '  Hello  \n  World  ',
    })
  })

  it('should handle section at start', () => {
    const tokens = tokenize('{{#section}}content{{/section}} after')
    const ast = parse(tokens)
    expect(ast).toHaveLength(2)
    expect(ast[0]?.type).toBe('section')
    expect(ast[1]?.type).toBe('text')
  })

  it('should handle section at end', () => {
    const tokens = tokenize('before {{#section}}content{{/section}}')
    const ast = parse(tokens)
    expect(ast).toHaveLength(2)
    expect(ast[0]?.type).toBe('text')
    expect(ast[1]?.type).toBe('section')
  })
})

describe('Parser - Real World Templates', () => {
  it('should parse user list template', () => {
    const template = `
      <ul>
      {{#users}}
        <li>{{name}} ({{email}})</li>
      {{/users}}
      </ul>
    `
    const tokens = tokenize(template)
    const ast = parse(tokens)
    expect(ast.length).toBeGreaterThan(0)
  })

  it('should parse conditional template', () => {
    const template = `
      {{#loggedIn}}
        Welcome back, {{username}}!
      {{/loggedIn}}
      {{^loggedIn}}
        Please log in.
      {{/loggedIn}}
    `
    const tokens = tokenize(template)
    const ast = parse(tokens)
    expect(ast.length).toBeGreaterThan(0)
  })

  it('should parse nested data template', () => {
    const template = `
      {{#article}}
        <h1>{{title}}</h1>
        <p>By {{author.name}}</p>
        {{#comments}}
          <div>{{user}}: {{text}}</div>
        {{/comments}}
      {{/article}}
    `
    const tokens = tokenize(template)
    const ast = parse(tokens)
    // Template has leading/trailing whitespace text nodes
    expect(ast.length).toBeGreaterThan(0)
    // Find the section node
    const section = ast.find(node => node.type === 'section')
    expect(section).toBeDefined()
    expect(section).toMatchObject({
      type: 'section',
      name: 'article',
    })
  })
})
