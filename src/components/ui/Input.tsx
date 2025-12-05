import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  wrapperClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, wrapperClassName, className, id, ...props }, ref) => {
    const inputId = id || (label ? `input-${label.replace(/\s+/g, "-").toLowerCase()}` : undefined);

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
          className={`input input-bordered w-full focus:input-primary transition-all ${
            error ? "input-error" : ""
          } ${className || ""}`}
          {...props}
        />
        {error && (
          <label className="label">
            <span className="label-text-alt text-error">{error}</span>
          </label>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
