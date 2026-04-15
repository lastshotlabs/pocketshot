import { describe, expect, it, vi, beforeEach } from 'vitest'
import React from 'react'
import { Markdown, parseMarkdown } from '../component'
import { MarkdownSchema } from '../schema'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

function cfg(overrides: Record<string, unknown> = {}) {
  return MarkdownSchema.parse({
    content: '# Heading\nHello **world**',
    ...overrides,
  })
}

describe('Markdown', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders plain markdown content', () => {
    const { getByText } = renderWithProviders(<Markdown config={cfg()} />)

    expect(getByText('Heading')).toBeTruthy()
    expect(getByText('Hello world')).toBeTruthy()
  })

  it('resolves content from screen context', () => {
    const { getByText } = renderWithProviders(
      <Markdown config={cfg({ content: { from: 'article.body' }, textAlign: 'center' })} />,
      { initialValues: { article: { body: '## Intro\nBody copy' } } },
    )

    expect(getByText('Intro')).toBeTruthy()
    expect(getByText('Body copy')).toBeTruthy()
  })

  it('parses headings, lists, quotes, and code blocks', () => {
    const nodes = parseMarkdown('# Title\n- One\n> Quote\n```\nconst x = 1\n```')

    expect(nodes.map((node) => node.type)).toEqual([
      'heading',
      'list_item',
      'blockquote',
      'code_block',
    ])
  })
})
