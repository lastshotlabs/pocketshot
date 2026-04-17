import { beforeEach, describe, expect, it, vi } from 'vitest'
import React from 'react'
import { FileUploader } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

describe('FileUploader', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders the picker affordance', () => {
    const { getByText } = renderWithProviders(<FileUploader config={{ id: 'upload' }} />)

    expect(getByText('Tap to select files')).toBeTruthy()
  })

  it('renders a resolved label from screen context', () => {
    const { getByText } = renderWithProviders(
      <FileUploader config={{ id: 'upload', label: { from: 'copy.label' } }} />,
      { initialValues: { copy: { label: 'Upload assets' } } },
    )

    expect(getByText('Upload assets')).toBeTruthy()
  })

  it('renders files from a ref-backed value', () => {
    const { getByText } = renderWithProviders(
      <FileUploader config={{ id: 'upload', value: { from: 'files.items' } }} />,
      { initialValues: { files: { items: ['https://example.com/photo.jpg'] } } },
    )

    expect(getByText('photo.jpg')).toBeTruthy()
  })

  it('applies the wrapper testID', () => {
    const { getByTestId } = renderWithProviders(
      <FileUploader config={{ id: 'upload', testID: 'file-upload' }} />,
    )

    expect(getByTestId('file-upload')).toBeTruthy()
  })

  it('renders slot surfaces without crashing', () => {
    const { toJSON } = renderWithProviders(
      <FileUploader
        config={{
          id: 'upload',
          slots: {
            dropZone: { borderRadius: 'xl' },
            fileName: { letterSpacing: 'wide' },
            removeText: { color: 'primary' },
          },
        }}
      />,
    )

    expect(toJSON()).toBeTruthy()
  })
})
