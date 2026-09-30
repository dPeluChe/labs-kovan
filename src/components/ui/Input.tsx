import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  wrapperClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, wrapperClassName, className, id, ...props }, ref) => {
    const autoId = React.useId();
    const inputId = id || autoId;
    const errorId = `${inputId}-error`;

    return (
      <div className={`form-control w-full ${wrapperClassName || ""}`}>
        {label && (
          <label htmlFor={inputId} className="label">
            <span className="label-text font-medium">{label}</span>
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={`input input-bordered w-full focus:input-primary transition-all ${
            error ? "input-error" : ""
          } ${className || ""}`}
          {...props}
        />
        {error && (
          <p id={errorId} className="label">
            <span className="label-text-alt text-error">{error}</span>
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
