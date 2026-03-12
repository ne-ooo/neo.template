/**
 * Edge case tests for @lpm.dev/neo.template
 *
 * Covers: deep nesting, null/undefined context, custom delimiters via noEscape,
 * partials, helpers, getValue dot-notation, escapeHTML, isFalsy.
 */

import { describe, it, expect } from 'vitest'
import { render, compile, escapeHTML, getValue } from '../../src/index.js'

// ─── escapeHTML ───────────────────────────────────────────────────────────────

describe('escapeHTML', () => {
  it('escapes &', () => {
    expect(escapeHTML('AT&T')).toBe('AT&amp;T')
  })

  it('escapes <', () => {
    expect(escapeHTML('<div>')).toBe('&lt;div&gt;')
  })

  it('escapes >', () => {
    expect(escapeHTML('a > b')).toBe('a &gt; b')
  })

  it('escapes "', () => {
    expect(escapeHTML('"hello"')).toBe('&quot;hello&quot;')
  })

  it("escapes '", () => {
    expect(escapeHTML("it's")).toBe('it&#x27;s')
  })

  it('escapes /', () => {
    expect(escapeHTML('path/to/file')).toBe('path&#x2F;to&#x2F;file')
  })

  it('returns empty string unchanged', () => {
    expect(escapeHTML('')).toBe('')
  })

  it('returns plain text unchanged', () => {
    expect(escapeHTML('hello world')).toBe('hello world')
  })

  it('escapes all entities in a full XSS payload', () => {
    const result = escapeHTML('<script>alert("xss")</script>')
    expect(result).not.toContain('<')
    expect(result).not.toContain('>')
    expect(result).not.toContain('"')
    expect(result).not.toContain('/')
  })
})

// ─── getValue ─────────────────────────────────────────────────────────────────

describe('getValue', () => {
  it('returns top-level property', () => {
    expect(getValue({ name: 'Alice' }, 'name')).toBe('Alice')
  })

  it('returns nested property via dot notation', () => {
    expect(getValue({ user: { name: 'Alice' } }, 'user.name')).toBe('Alice')
  })

  it('returns deeply nested property', () => {
    const ctx = { a: { b: { c: 42 } } }
    expect(getValue(ctx, 'a.b.c')).toBe(42)
  })

  it('returns undefined for missing top-level key', () => {
    expect(getValue({}, 'missing')).toBeUndefined()
  })

  it('returns undefined for missing nested key', () => {
    expect(getValue({ user: {} }, 'user.name')).toBeUndefined()
  })

  it('returns undefined when intermediate is null', () => {
    expect(getValue({ user: null }, 'user.name')).toBeUndefined()
  })

  it('returns context itself when path is empty', () => {
    const ctx = { x: 1 }
    expect(getValue(ctx, '')).toBe(ctx)
  })

  it('returns numeric 0', () => {
    expect(getValue({ count: 0 }, 'count')).toBe(0)
  })

  it('returns false', () => {
    expect(getValue({ active: false }, 'active')).toBe(false)
  })
})

// ─── render — deep nesting ────────────────────────────────────────────────────

describe('render — deep nesting', () => {
  it('renders one level of object nesting', () => {
    const result = render(
      '{{#a}}{{b}}{{/a}}',
      { a: { b: 'inner' } }
    )
    expect(result).toBe('inner')
  })

  it('renders nested sections when all keys are at root level', () => {
    // NOTE: nested sections ({{#a}}{{#b}}...{{/b}}{{/a}}) fall back to the outer
    // `context` variable when compiled, so all keys must exist at the root.
    const result = render(
      '{{#a}}{{#b}}{{c}}{{/b}}{{/a}}',
      { a: true, b: true, c: 'flat' }
    )
    expect(result).toBe('flat')
  })

  it('renders array of objects with properties', () => {
    const result = render(
      '{{#items}}{{name}},{{/items}}',
      { items: [{ name: 'A' }, { name: 'B' }, { name: 'C' }] }
    )
    expect(result).toBe('A,B,C,')
  })

  it('renders section with truthy boolean', () => {
    const result = render('{{#active}}yes{{/active}}', { active: true })
    expect(result).toBe('yes')
  })

  it('does not render section with false', () => {
    const result = render('{{#active}}yes{{/active}}', { active: false })
    expect(result).toBe('')
  })

  it('does not render section with empty array', () => {
    const result = render('{{#items}}item{{/items}}', { items: [] })
    expect(result).toBe('')
  })
})

// ─── render — null/undefined context ─────────────────────────────────────────

describe('render — null and undefined values', () => {
  it('renders empty string for missing variable', () => {
    expect(render('{{missing}}')).toBe('')
  })

  it('renders empty string for null variable', () => {
    expect(render('{{val}}', { val: null })).toBe('')
  })

  it('renders empty string for undefined variable', () => {
    expect(render('{{val}}', { val: undefined })).toBe('')
  })

  it('skips section when value is null', () => {
    expect(render('{{#val}}shown{{/val}}', { val: null })).toBe('')
  })

  it('shows inverted section when value is undefined', () => {
    expect(render('{{^val}}fallback{{/val}}', { val: undefined })).toBe('fallback')
  })

  it('renders 0 as "0" not as falsy in variable', () => {
    // 0 is a falsy but still a meaningful value to display
    const result = render('{{count}}', { count: 0 })
    expect(result).toBe('0')
  })

  it('renders false as "false" in variable', () => {
    const result = render('{{flag}}', { flag: false })
    expect(result).toBe('false')
  })
})

// ─── render — inverted sections ───────────────────────────────────────────────

describe('render — inverted sections', () => {
  it('shows inverted section for empty array', () => {
    expect(render('{{^items}}none{{/items}}', { items: [] })).toBe('none')
  })

  it('hides inverted section for non-empty array', () => {
    expect(render('{{^items}}none{{/items}}', { items: [1] })).toBe('')
  })

  it('shows inverted section for false', () => {
    expect(render('{{^active}}inactive{{/active}}', { active: false })).toBe('inactive')
  })

  it('hides inverted section for true', () => {
    expect(render('{{^active}}inactive{{/active}}', { active: true })).toBe('')
  })

  it('shows inverted section for null', () => {
    expect(render('{{^val}}missing{{/val}}', { val: null })).toBe('missing')
  })
})

// ─── render — unescaped output ────────────────────────────────────────────────

describe('render — unescaped HTML', () => {
  it('triple braces allow raw HTML', () => {
    const result = render('{{{html}}}', { html: '<b>bold</b>' })
    expect(result).toBe('<b>bold</b>')
  })

  it('double braces escape HTML', () => {
    const result = render('{{html}}', { html: '<b>bold</b>' })
    expect(result).not.toContain('<b>')
    expect(result).toContain('&lt;b&gt;')
  })

  it('noEscape option disables HTML escaping', () => {
    const result = render('{{html}}', { html: '<b>bold</b>' }, { noEscape: true })
    expect(result).toBe('<b>bold</b>')
  })
})

// ─── render — partials ────────────────────────────────────────────────────────

describe('render — partials', () => {
  it('renders a partial from partials map (raw string interpolation)', () => {
    // NOTE: The current partial implementation returns the raw partial string,
    // it does NOT re-render the partial against the current context.
    // So '{{name}}' inside a partial is NOT evaluated.
    const result = render(
      'Hello {{> greeting}}!',
      { name: 'World' },
      { partials: { greeting: 'there' } }
    )
    expect(result).toBe('Hello there!')
  })

  it('returns raw partial string (partials are not re-rendered)', () => {
    // Document known limitation: partials are not compiled against context
    const result = render(
      '{{> header}}',
      { title: 'Home' },
      { partials: { header: 'HEADER' } }
    )
    expect(result).toBe('HEADER')
  })

  it('renders empty string for unknown partial', () => {
    // Missing partials should degrade gracefully
    const result = render('{{> missing}}', {}, { partials: {} })
    expect(result).toBe('')
  })

  it('uses resolver function for partials', () => {
    const result = render(
      'prefix {{> foo}} suffix',
      {},
      { partials: (name) => name === 'foo' ? 'BAR' : undefined }
    )
    expect(result).toBe('prefix BAR suffix')
  })
})

// ─── compile — reuse and isolation ────────────────────────────────────────────

describe('compile — reuse and isolation', () => {
  it('compiled template can be called multiple times', () => {
    const tpl = compile('Hi {{name}}')
    expect(tpl({ name: 'Alice' })).toBe('Hi Alice')
    expect(tpl({ name: 'Bob' })).toBe('Hi Bob')
    expect(tpl({ name: 'Carol' })).toBe('Hi Carol')
  })

  it('compiled templates do not share state between calls', () => {
    const tpl = compile('{{count}}')
    expect(tpl({ count: 1 })).toBe('1')
    expect(tpl({ count: 2 })).toBe('2')
    expect(tpl({ count: 1 })).toBe('1')
  })

  it('empty template returns empty string', () => {
    const tpl = compile('')
    expect(tpl({})).toBe('')
  })

  it('template with only text returns that text', () => {
    const tpl = compile('Hello, World!')
    expect(tpl({})).toBe('Hello, World!')
  })
})

// ─── comments ────────────────────────────────────────────────────────────────

describe('render — comments', () => {
  it('strips comment tokens', () => {
    expect(render('a{{! removed }}b')).toBe('ab')
  })

  it('strips multi-word comments', () => {
    expect(render('{{! this is a multi word comment }}')).toBe('')
  })

  it('strips comment but keeps surrounding text', () => {
    expect(render('before{{! comment }}after')).toBe('beforeafter')
  })
})

// ─── helpers (BUG-2 coverage) ─────────────────────────────────────────────────

describe('render — helpers', () => {
  it('calls a helper function from options.helpers', () => {
    const result = render('{{shout}}', { name: 'world' }, {
      helpers: { shout: (ctx: Record<string, unknown>) => String(ctx.name).toUpperCase() },
    })
    expect(result).toBe('WORLD')
  })

  it('context value takes precedence over helper with same name', () => {
    const result = render('{{name}}', { name: 'from-context' }, {
      helpers: { name: () => 'from-helper' },
    })
    expect(result).toBe('from-context')
  })

  it('helper receives the current context object', () => {
    const result = render('{{greet}}', { firstName: 'Jane', lastName: 'Doe' }, {
      helpers: { greet: (ctx: Record<string, unknown>) => `Hi ${ctx.firstName} ${ctx.lastName}` },
    })
    expect(result).toBe('Hi Jane Doe')
  })

  it('returns empty string when helper is not a function', () => {
    const result = render('{{notfn}}', {}, {
      helpers: { notfn: 42 as unknown as () => string },
    })
    expect(result).toBe('')
  })

  it('helper returning empty string renders empty', () => {
    const result = render('prefix-{{empty}}-suffix', {}, {
      helpers: { empty: () => '' },
    })
    expect(result).toBe('prefix--suffix')
  })
})
