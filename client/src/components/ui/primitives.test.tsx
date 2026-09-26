import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { ConfirmDialog } from './confirm-dialog';
import { Field } from './field';
import { Input } from './input';
import { StatusBadge } from './badge';
import { SummaryStrip } from './page';
import { decompteStatus, missionStatus } from 'constants/statusLabels';

describe('Field', () => {
  it('labels the control and announces errors', () => {
    render(
      <Field label="Destination" error="Champ obligatoire" required>
        <Input />
      </Field>,
    );
    const input = screen.getByRole('textbox', { name: /destination/i });
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Champ obligatoire');
    expect(input).toBeRequired();
  });
});

describe('StatusBadge', () => {
  it('uses the glossary labels', () => {
    render(
      <>
        <StatusBadge map={missionStatus} code="COMPLETED" />
        <StatusBadge map={decompteStatus} code="REGECTED" />
      </>,
    );
    expect(screen.getByText('Validé')).toBeInTheDocument();
    expect(screen.getByText('Rejeté')).toBeInTheDocument();
  });
});

describe('ConfirmDialog', () => {
  it('confirms, and cancels with Escape', async () => {
    const onConfirm = vi.fn();
    function Harness() {
      const [open, setOpen] = useState(true);
      return (
        <ConfirmDialog open={open} onOpenChange={setOpen} title="Archiver ?" description="Action définitive" tone="danger" onConfirm={onConfirm} />
      );
    }
    const { unmount } = render(<Harness />);
    expect(screen.getByRole('alertdialog', { name: 'Archiver ?' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Confirmer' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    unmount();

    render(<Harness />);
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});

describe('SummaryStrip', () => {
  it('toggles a filter key', async () => {
    const onSelect = vi.fn();
    render(<SummaryStrip items={[{ key: 'PENDING', label: 'En attente', value: 2 }]} active={null} onSelect={onSelect} />);
    const button = screen.getByRole('button', { name: /en attente/i });
    expect(button).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(button);
    expect(onSelect).toHaveBeenCalledWith('PENDING');
  });
});
