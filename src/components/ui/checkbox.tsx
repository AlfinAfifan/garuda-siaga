'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

type CheckboxProps = Omit<React.ComponentProps<'input'>, 'type'> & {
  /** Tampilkan state sebagian terpilih (mis. header tabel saat hanya sebagian baris dicentang) */
  indeterminate?: boolean;
};

export function Checkbox({ className, indeterminate = false, checked, ...props }: CheckboxProps) {
  const ref = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = indeterminate && !checked;
    }
  }, [indeterminate, checked]);

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      className={cn('size-4 shrink-0 cursor-pointer rounded border-gray-300 accent-[#067a4e] disabled:cursor-not-allowed disabled:opacity-40', className)}
      {...props}
    />
  );
}

export default Checkbox;
