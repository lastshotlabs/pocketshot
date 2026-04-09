import { describe, it, expect } from 'vitest'
import { parseDeepLink, matchPattern } from '../../src/deep-links/parse'

// ── parseDeepLink ─────────────────────────────────────────────────────────────

describe('parseDeepLink', () => {
  it('parses a standard https URL', () => {
    const result = parseDeepLink('https://example.com/post/123?ref=email')
    expect(result.scheme).toBe('https')
    expect(result.hostname).toBe('example.com')
    expect(result.pathSegments).toEqual(['post', '123'])
    expect(result.queryParams).toEqual({ ref: 'email' })
    expect(result.url).toBe('https://example.com/post/123?ref=email')
  })

  it('parses a custom scheme URL', () => {
    const result = parseDeepLink('myapp://post/123?ref=push')
    expect(result.scheme).toBe('myapp')
    expect(result.hostname).toBe('post')
    expect(result.pathSegments).toEqual(['123'])
    expect(result.queryParams).toEqual({ ref: 'push' })
  })

  it('parses a URL with no path', () => {
    const result = parseDeepLink('myapp://home')
    expect(result.scheme).toBe('myapp')
    expect(result.hostname).toBe('home')
    expect(result.pathSegments).toEqual([])
  })

  it('parses a URL with multiple query params', () => {
    const result = parseDeepLink('https://example.com/search?q=hello&page=2&sort=asc')
    expect(result.queryParams).toEqual({ q: 'hello', page: '2', sort: 'asc' })
  })

  it('returns empty segments and params for a root URL', () => {
    const result = parseDeepLink('https://example.com/')
    expect(result.pathSegments).toEqual([])
    expect(result.queryParams).toEqual({})
  })

  it('never throws on malformed input', () => {
    expect(() => parseDeepLink('')).not.toThrow()
    expect(() => parseDeepLink('not-a-url')).not.toThrow()
    expect(() => parseDeepLink('://broken')).not.toThrow()
  })

  it('returns null scheme and hostname for unparseable input', () => {
    const result = parseDeepLink('not-a-url')
    expect(result.scheme).toBeNull()
    expect(result.hostname).toBeNull()
    expect(result.pathSegments).toEqual([])
  })

  it('strips trailing slash from path segments', () => {
    const result = parseDeepLink('https://example.com/post/123/')
    expect(result.pathSegments).toEqual(['post', '123'])
  })

  it('preserves the original url field', () => {
    const url = 'myapp://screen/detail?id=42'
    expect(parseDeepLink(url).url).toBe(url)
  })

  it('parses URL-encoded query params', () => {
    const result = parseDeepLink('myapp://search?q=hello%20world')
    expect(result.queryParams.q).toBe('hello world')
  })
})

// ── matchPattern ──────────────────────────────────────────────────────────────

describe('matchPattern', () => {
  it('matches an exact path with no params', () => {
    expect(matchPattern('/home', ['home'])).toEqual({})
  })

  it('extracts a single named param', () => {
    expect(matchPattern('/post/:id', ['post', '123'])).toEqual({ id: '123' })
  })

  it('extracts multiple named params', () => {
    expect(matchPattern('/user/:userId/post/:postId', ['user', 'abc', 'post', '456'])).toEqual({
      userId: 'abc',
      postId: '456',
    })
  })

  it('returns null when segment count differs', () => {
    expect(matchPattern('/post/:id', ['post'])).toBeNull()
    expect(matchPattern('/post/:id', ['post', '123', 'extra'])).toBeNull()
  })

  it('returns null when a literal segment does not match', () => {
    expect(matchPattern('/post/:id', ['comment', '123'])).toBeNull()
  })

  it('handles a single root-level param', () => {
    expect(matchPattern('/:type', ['profile'])).toEqual({ type: 'profile' })
  })

  it('returns empty object for empty pattern and segments', () => {
    expect(matchPattern('/', [])).toEqual({})
    expect(matchPattern('', [])).toEqual({})
  })

  it('URL-decodes captured param values', () => {
    expect(matchPattern('/tag/:name', ['tag', 'hello%20world'])).toEqual({ name: 'hello world' })
  })

  it('is case-sensitive for literal segments', () => {
    expect(matchPattern('/Post/:id', ['post', '1'])).toBeNull()
    expect(matchPattern('/post/:id', ['post', '1'])).toEqual({ id: '1' })
  })
})
