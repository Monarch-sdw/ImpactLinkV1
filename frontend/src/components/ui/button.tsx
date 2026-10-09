import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const variants = cva('btn', {
  variants: {
    variant: { default:'btn-primary', outline:'btn-outline', ghost:'btn-ghost', danger:'btn-danger' },
    size: { default:'btn-regular', large:'btn-large', icon:'btn-icon' },
  },
  defaultVariants: { variant:'default', size:'default' },
});
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof variants> {
  asChild?: boolean;
  loading?: boolean;
}
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
  className, variant, size, asChild=false, loading=false, disabled, children, ...props
}, ref) => {
  const classes=twMerge(clsx(variants({variant,size}),className));
  if(asChild) return <Slot ref={ref} className={classes} {...props}>{children}</Slot>;
  return <button ref={ref} className={classes} {...props} disabled={disabled||loading}
    aria-busy={loading||props['aria-busy']} data-loading={loading||undefined}>
    <span className="btn-content">{children}</span>
    {loading&&<span className="btn-loading" aria-hidden="true"><span className="loading-bars"><i/><i/><i/></span></span>}
  </button>;
});
Button.displayName='Button';
