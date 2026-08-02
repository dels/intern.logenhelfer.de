import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PhoneLink, EmailLink } from './ContactLinks';

describe('ContactLinks', () => {
  it('renders a phone number as a tel: link, keeping the display text as-is but stripping whitespace from the href so dialers can call it', () => {
    render(<PhoneLink phone="0170 1234567" />);
    const link = screen.getByRole('link', { name: '0170 1234567' });
    expect(link).toHaveAttribute('href', 'tel:01701234567');
  });

  it('renders an international phone number with parentheses, stripping only whitespace from the href', () => {
    render(<PhoneLink phone="+49 (176) 99220022" />);
    const link = screen.getByRole('link', { name: '+49 (176) 99220022' });
    expect(link).toHaveAttribute('href', 'tel:+49(176)99220022');
  });

  it('renders an email address as a mailto: link', () => {
    render(<EmailLink email="max@example.test" />);
    const link = screen.getByRole('link', { name: 'max@example.test' });
    expect(link).toHaveAttribute('href', 'mailto:max@example.test');
  });

  it('stops click propagation so the link works inside a clickable row', () => {
    const onRowClick = vi.fn();
    render(
      // oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- stand-in for a real row click handler under test, not a UI element
      <div onClick={onRowClick}>
        <PhoneLink phone="0170 1234567" />
      </div>,
    );
    screen.getByRole('link').click();
    expect(onRowClick).not.toHaveBeenCalled();
  });
});
