import { forwardRef } from 'react';
import { Button, type ButtonProps } from './button';
import { Tooltip } from './tooltip';

export interface IconButtonProps extends Omit<ButtonProps, 'size' | 'children'> {
  /** Accessible name, also shown as tooltip. */
  label: string;
  icon: React.ReactNode;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ label, icon, variant = 'ghost', ...props }, ref) => (
    <Tooltip content={label}>
      <Button ref={ref} size="icon" variant={variant} aria-label={label} {...props}>
        {icon}
      </Button>
    </Tooltip>
  ),
);
IconButton.displayName = 'IconButton';
