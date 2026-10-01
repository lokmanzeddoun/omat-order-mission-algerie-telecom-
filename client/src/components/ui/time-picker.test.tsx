import { useState } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TimePicker } from './time-picker';

function Harness({ initial = '', onChange }: { initial?: string; onChange?: (v: string) => void }) {
  const [value, setValue] = useState(initial);
  return (
    <TimePicker
      aria-label="Heure"
      value={value}
      onChange={(v) => {
        setValue(v);
        onChange?.(v);
      }}
    />
  );
}

const input = () => screen.getByLabelText('Heure') as HTMLInputElement;
const openButton = () => screen.getByRole('button', { name: /heure|time/i });

describe('TimePicker', () => {
  it('shows the value in 24h', () => {
    render(<Harness initial="17:05" />);
    expect(input()).toHaveValue('17:05');
  });

  it('masks typing as HH:mm and commits when complete', async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    await userEvent.type(input(), '0830');
    expect(input()).toHaveValue('08:30');
    expect(onChange).toHaveBeenLastCalledWith('08:30');
  });

  it('normalizes a loose entry on blur and drops impossible digits', async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    await userEvent.type(input(), '8');
    expect(input()).toHaveValue('08');
    await userEvent.tab();
    expect(onChange).toHaveBeenLastCalledWith('08:00');
    expect(input()).toHaveValue('08:00');
  });

  it('picks hour and minute from the columns, closing after the minute', async () => {
    const onChange = vi.fn();
    render(<Harness initial="08:00" onChange={onChange} />);
    await userEvent.click(openButton());
    const hours = await screen.findByRole('listbox', { name: /heures/i });
    await userEvent.click(within(hours).getByRole('option', { name: '17' }));
    expect(onChange).toHaveBeenLastCalledWith('17:00');
    expect(screen.getByRole('listbox', { name: /minutes/i })).toBeInTheDocument();
    await userEvent.click(
      within(screen.getByRole('listbox', { name: /minutes/i })).getByRole('option', { name: '45' }),
    );
    expect(onChange).toHaveBeenLastCalledWith('17:45');
    expect(screen.queryByRole('listbox', { name: /minutes/i })).not.toBeInTheDocument();
  });

  it('never shows AM/PM and lists all 24 hours', async () => {
    render(<Harness initial="08:00" />);
    await userEvent.click(openButton());
    const hours = await screen.findByRole('listbox', { name: /heures/i });
    expect(within(hours).getAllByRole('option')).toHaveLength(24);
    expect(document.body.textContent).not.toMatch(/\b(am|pm)\b/i);
  });

  it('steps with the arrow keys (5 min, Shift = 1 hour)', async () => {
    const onChange = vi.fn();
    render(<Harness initial="08:00" onChange={onChange} />);
    await userEvent.click(input());
    await userEvent.keyboard('{ArrowUp}');
    expect(onChange).toHaveBeenLastCalledWith('08:05');
    await userEvent.keyboard('{Shift>}{ArrowDown}{/Shift}');
    expect(onChange).toHaveBeenLastCalledWith('07:05');
  });

  it('is plain and read-only in view mode', () => {
    render(<TimePicker aria-label="Heure" value="08:00" onChange={() => {}} readOnly />);
    expect(input()).toHaveAttribute('readonly');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
