import { useState } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DatePicker } from './date-picker';

function Harness({ initial = '', min, onChange }: { initial?: string; min?: string; onChange?: (v: string) => void }) {
  const [value, setValue] = useState(initial);
  return (
    <DatePicker
      aria-label="Date"
      value={value}
      min={min}
      onChange={(v) => {
        setValue(v);
        onChange?.(v);
      }}
    />
  );
}

const input = () => screen.getByLabelText('Date') as HTMLInputElement;

describe('DatePicker', () => {
  it('shows the value as DD/MM/YYYY', () => {
    render(<Harness initial="2026-03-15" />);
    expect(input()).toHaveValue('15/03/2026');
  });

  it('masks typing and commits an ISO date once complete and valid', async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    await userEvent.type(input(), '15032026');
    expect(input()).toHaveValue('15/03/2026');
    expect(onChange).toHaveBeenLastCalledWith('2026-03-15');
  });

  it('rejects impossible dates and reverts on blur', async () => {
    const onChange = vi.fn();
    render(<Harness initial="2026-03-15" onChange={onChange} />);
    await userEvent.clear(input());
    expect(onChange).toHaveBeenLastCalledWith('');
    await userEvent.type(input(), '31022026');
    expect(onChange).toHaveBeenLastCalledWith('');
    await userEvent.tab();
    expect(input()).toHaveValue('');
  });

  it('picks a day from the calendar', async () => {
    const onChange = vi.fn();
    render(<Harness initial="2026-03-15" onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: /calendrier|calendar/i }));
    const grid = await screen.findByRole('grid');
    await userEvent.click(within(grid).getByRole('gridcell', { name: /20 mars 2026/i }));
    expect(onChange).toHaveBeenLastCalledWith('2026-03-20');
    expect(input()).toHaveValue('20/03/2026');
    expect(screen.queryByRole('grid')).not.toBeInTheDocument();
  });

  it('navigates months', async () => {
    render(<Harness initial="2026-03-15" />);
    await userEvent.click(screen.getByRole('button', { name: /calendrier|calendar/i }));
    await userEvent.click(await screen.findByRole('button', { name: /mois suivant/i }));
    expect(within(screen.getByRole('grid')).getByRole('gridcell', { name: /10 avril 2026/i })).toBeInTheDocument();
  });

  it('disables days before min and ignores typed dates before min', async () => {
    const onChange = vi.fn();
    render(<Harness initial="2026-03-15" min="2026-03-10" onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: /calendrier|calendar/i }));
    expect(await screen.findByRole('gridcell', { name: /^9 mars 2026$/i })).toBeDisabled();
    expect(screen.getByRole('gridcell', { name: /^10 mars 2026$/i })).toBeEnabled();
  });

  it('moves with the arrow keys and selects with Enter, Escape closes', async () => {
    const onChange = vi.fn();
    render(<Harness initial="2026-03-15" onChange={onChange} />);
    await userEvent.click(input());
    await screen.findByRole('grid');
    await userEvent.keyboard('{ArrowRight}{ArrowDown}{Enter}');
    expect(onChange).toHaveBeenLastCalledWith('2026-03-23');
    await userEvent.click(input());
    await screen.findByRole('grid');
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('grid')).not.toBeInTheDocument();
  });

  it('offers Today and Clear', async () => {
    const onChange = vi.fn();
    render(<Harness initial="2026-03-15" onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: /calendrier|calendar/i }));
    await userEvent.click(await screen.findByRole('button', { name: /effacer/i }));
    expect(onChange).toHaveBeenLastCalledWith('');
  });

  it('is plain and read-only in view mode', () => {
    render(<DatePicker aria-label="Date" value="2026-03-15" onChange={() => {}} readOnly />);
    expect(input()).toHaveValue('15/03/2026');
    expect(input()).toHaveAttribute('readonly');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
