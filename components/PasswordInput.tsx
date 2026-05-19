'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface Props {
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
  id?: string;
}

export function PasswordInput({
  value,
  onChange,
  autoComplete = 'current-password',
  required,
  minLength,
  id,
}: Props) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 pr-10 text-sm focus:border-zinc-900 focus:outline-none"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? 'Hide password' : 'Show password'}
        className="absolute right-2 top-[calc(50%+2px)] -translate-y-1/2 cursor-pointer rounded p-1 text-zinc-500 hover:text-zinc-900"
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}
