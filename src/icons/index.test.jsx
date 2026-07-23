import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import {
  MenuIcon,
  PlusIcon,
  EditIcon,
  DeleteIcon,
  BackIcon,
  RestoreIcon,
} from './index.jsx'

// Issue #96: inline SVG-Set, offline-sicher, theme-fähig über currentColor,
// dekorativ (Bedeutung trägt das umgebende <button aria-label>, nicht das Icon).
const ICONS = { MenuIcon, PlusIcon, EditIcon, DeleteIcon, BackIcon, RestoreIcon }

describe('Icon-Set', () => {
  it.each(Object.entries(ICONS))(
    '%s rendert ein dekoratives, farbvererbendes SVG',
    (_name, IconComponent) => {
      const { container } = render(<IconComponent />)
      const svg = container.querySelector('svg')

      expect(svg).toBeInTheDocument()
      expect(svg).toHaveAttribute('aria-hidden', 'true')
      expect(svg).toHaveAttribute('focusable', 'false')
      expect(
        svg.getAttribute('stroke') === 'currentColor' ||
          svg.getAttribute('fill') === 'currentColor',
      ).toBe(true)
      expect(svg.children.length).toBeGreaterThan(0)
    },
  )

  it('gibt zusätzliche Props (z.B. className) an das SVG weiter', () => {
    const { container } = render(<PlusIcon className="icon--sm" />)
    expect(container.querySelector('svg')).toHaveClass('icon--sm')
  })
})
