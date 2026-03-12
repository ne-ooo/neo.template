/**
 * HTML escaping utilities
 */

/**
 * HTML entities to escape
 */
const ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
}

const ESCAPE_REGEX = /[&<>"'/]/g

/**
 * Escape HTML special characters
 * 
 * @param str - String to escape
 * @returns Escaped string safe for HTML
 * 
 * @example
 * ```ts
 * escapeHTML('<script>') // '&lt;script&gt;'
 * escapeHTML('AT&T')     // 'AT&amp;T'
 * ```
 */
export function escapeHTML(str: string): string {
  return str.replace(ESCAPE_REGEX, (char) => ESCAPE_MAP[char] || char)
}

/**
 * Get value from context by path
 * 
 * Supports dot notation: "user.name"
 * 
 * @param context - Template context
 * @param path - Property path
 * @returns Value at path or undefined
 * 
 * @example
 * ```ts
 * getValue({ user: { name: 'John' } }, 'user.name') // 'John'
 * getValue({ user: { name: 'John' } }, 'user.age')  // undefined
 * ```
 */
export function getValue(context: Record<string, unknown>, path: string): unknown {
  if (!path) return context

  // Special case: '.' refers to the current context item (used in arrays)
  if (path === '.') {
    return context['.']
  }

  const parts = path.split('.')
  let value: unknown = context

  for (const part of parts) {
    if (value === null || value === undefined) {
      return undefined
    }

    if (typeof value === 'object' && part in value) {
      value = (value as Record<string, unknown>)[part]
    } else {
      return undefined
    }
  }

  return value
}

/**
 * Check if value is falsy for template evaluation
 * 
 * Mustache/Handlebars falsy values:
 * - false
 * - 0
 * - null
 * - undefined
 * - empty string
 * - empty array
 * 
 * @param value - Value to check
 * @returns true if value is falsy
 */
export function isFalsy(value: unknown): boolean {
  if (value === false || value === 0 || value === null || value === undefined || value === '') {
    return true
  }

  if (Array.isArray(value) && value.length === 0) {
    return true
  }

  return false
}

/**
 * Check if value is an array or iterable
 * 
 * @param value - Value to check
 * @returns true if value is array-like
 */
export function isArrayLike(value: unknown): value is unknown[] {
  return Array.isArray(value)
}
