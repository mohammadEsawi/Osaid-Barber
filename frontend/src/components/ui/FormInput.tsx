import { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function FormInput({ label, error, className = '', ...props }: InputProps) {
  return (
    <div>
      {label && <label className="label">{label}</label>}
      <input className={`input-field ${error ? 'border-red-500' : ''} ${className}`} {...props} />
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}

export function FormTextarea({ label, error, className = '', ...props }: TextareaProps) {
  return (
    <div>
      {label && <label className="label">{label}</label>}
      <textarea className={`input-field resize-none ${error ? 'border-red-500' : ''} ${className}`} {...props} />
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}

export function FormSelect({ label, error, children, className = '', ...props }: { label?: string; error?: string; children: React.ReactNode } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div>
      {label && <label className="label">{label}</label>}
      <select className={`input-field ${error ? 'border-red-500' : ''} ${className}`} {...props}>
        {children}
      </select>
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}
