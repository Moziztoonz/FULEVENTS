"use client";

import { useId, useState } from "react";
import { Icon } from "./Icon";

export function PasswordInput({
  name,
  label = "Password",
  autoComplete = "current-password",
  error,
  hint,
  defaultValue,
  onValueChange,
}: {
  name: string;
  label?: string;
  autoComplete?: string;
  error?: string;
  hint?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}) {
  const id = useId();
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required
          minLength={8}
          defaultValue={defaultValue}
          onChange={(event) => onValueChange?.(event.target.value)}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className="input pr-12"
          placeholder="At least 8 characters"
        />
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-xl text-muted hover:text-ink"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          <Icon name={visible ? "eyeOff" : "eye"} size={18} />
        </button>
      </div>
      {error ? (
        <p id={`${id}-error`} className="field-error">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="hint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
