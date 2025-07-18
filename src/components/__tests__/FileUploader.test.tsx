import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { FileUploader } from '../FileUploader'

describe('FileUploader', () => {
  it('renders upload area', () => {
    const mockOnFilesLoaded = vi.fn()
    
    render(<FileUploader onFilesLoaded={mockOnFilesLoaded} />)
    
    expect(screen.getByText(/Drop CSV or Excel files here/)).toBeInTheDocument()
    expect(screen.getByText('Select Files')).toBeInTheDocument()
  })

  it('shows supported file types', () => {
    const mockOnFilesLoaded = vi.fn()
    
    render(<FileUploader onFilesLoaded={mockOnFilesLoaded} />)
    
    expect(screen.getByText(/Supports .csv, .xlsx, .xls files/)).toBeInTheDocument()
  })
})