import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DestinationInput } from './destination-input';

function Harness({ initial = '', onChange }: { initial?: string; onChange?: (v: string) => void }) {
  const [value, setValue] = useState(initial);
  return (
    <DestinationInput
      aria-label="Destination"
      value={value}
      onChange={(v) => {
        setValue(v);
        onChange?.(v);
      }}
    />
  );
}

const input = () => screen.getByRole('combobox', { name: 'Destination' });

describe('DestinationInput', () => {
  it('suggests wilayas and communes while typing', async () => {
    render(<Harness />);
    await userEvent.type(input(), 'tl');
    expect(await screen.findByRole('option', { name: 'Tlemcen' })).toBeInTheDocument();
  });

  it('selects a suggestion as a chip and joins several with " - "', async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    await userEvent.type(input(), 'oran');
    await userEvent.click(await screen.findByRole('option', { name: 'Oran' }));
    expect(onChange).toHaveBeenLastCalledWith('Oran');
    expect(screen.getByText('Oran', { selector: '[data-chip] span' })).toBeInTheDocument();

    await userEvent.type(input(), 'alger');
    await userEvent.click(await screen.findByRole('option', { name: 'Alger' }));
    expect(onChange).toHaveBeenLastCalledWith('Oran - Alger');
  });

  it('supports keyboard selection and Backspace removal', async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    await userEvent.type(input(), 'oran');
    await screen.findByRole('option', { name: 'Oran' });
    await userEvent.keyboard('{Enter}');
    expect(onChange).toHaveBeenLastCalledWith('Oran');
    await userEvent.keyboard('{Backspace}');
    expect(onChange).toHaveBeenLastCalledWith('');
  });

  it('removes a chip with its ✕ button', async () => {
    const onChange = vi.fn();
    render(<Harness initial="Oran - Alger" onChange={onChange} />);
    await userEvent.click(await screen.findByRole('button', { name: /Oran/ }));
    expect(onChange).toHaveBeenLastCalledWith('Alger');
  });

  it('does not accept free text', async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    await userEvent.type(input(), 'Atlantis{Enter}');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('marks the highlighted suggestion', async () => {
    render(<Harness />);
    await userEvent.type(input(), 'tl');
    const first = await screen.findAllByRole('option');
    expect(first[0]).toHaveAttribute('aria-selected', 'true');
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getAllByRole('option')[1]).toHaveAttribute('aria-selected', 'true');
  });

  it('converts a legacy value and asks to re-pick when it cannot', async () => {
    const onChange = vi.fn();
    const { unmount } = render(<Harness initial="Alger-Oran" onChange={onChange} />);
    await screen.findByRole('button', { name: /Alger/ });
    expect(onChange).toHaveBeenLastCalledWith('Alger - Oran');
    unmount();

    const onChange2 = vi.fn();
    render(<Harness initial="Nulle part" onChange={onChange2} />);
    expect(await screen.findByRole('status')).toHaveTextContent('Nulle part');
    expect(onChange2).toHaveBeenLastCalledWith('');
  });

  it('is read-only in view mode', async () => {
    render(<DestinationInput aria-label="Destination" value="Oran - Alger" onChange={() => {}} readOnly />);
    expect(await screen.findByText('Alger')).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
