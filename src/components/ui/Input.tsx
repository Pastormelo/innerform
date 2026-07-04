"use client";

import React from "react";

const fieldStyle: React.CSSProperties = {
  width: "100%",
  height: 48,
  padding: "0 16px",
  borderRadius: "var(--radius-md)",
  background: "var(--surface-inset)",
  border: "1px solid var(--border-subtle)",
  color: "var(--text-primary)",
  fontFamily: "var(--font-sans)",
  fontSize: 16,
  transition: "border-color var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out)",
};

export interface FieldProps {
  label?: string;
  hint?: string;
  optional?: boolean;
}

export function Field({ label, hint, optional, children }: FieldProps & { children: React.ReactNode }) {
  return (
    <label style={{ display: "block" }}>
      {label && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)" }}>{label}</span>
          {optional && <span style={{ fontSize: 12, color: "var(--text-muted)" }}>optional</span>}
        </div>
      )}
      {children}
      {hint && <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 6 }}>{hint}</div>}
    </label>
  );
}

export function Input({ label, hint, optional, style, ...rest }: FieldProps & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Field label={label} hint={hint} optional={optional}>
      <input style={{ ...fieldStyle, ...style }} {...rest} />
    </Field>
  );
}

export function Textarea({ label, hint, optional, style, ...rest }: FieldProps & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <Field label={label} hint={hint} optional={optional}>
      <textarea
        style={{ ...fieldStyle, height: "auto", minHeight: 92, padding: "12px 16px", resize: "vertical", lineHeight: 1.5, ...style }}
        {...rest}
      />
    </Field>
  );
}

export function Select({
  label,
  hint,
  optional,
  options,
  style,
  ...rest
}: FieldProps & React.SelectHTMLAttributes<HTMLSelectElement> & { options: { value: string; label: string }[] }) {
  return (
    <Field label={label} hint={hint} optional={optional}>
      <select style={{ ...fieldStyle, appearance: "none", cursor: "pointer", ...style }} {...rest}>
        {options.map((o) => (
          <option key={o.value} value={o.value} style={{ background: "var(--ink-900)" }}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}
