import React from "react";
import { v4 as uuidv4 } from 'uuid'; // Need to install uuid if not already present

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  wrapperClassName?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, wrapperClassName, className, id, ...props }, ref) => {
    const selectId = id || (label ? `select-${label.replace(/\s+/g, "-").toLowerCase()}-${uuidv4()}` : `select-${uuidv4()}`);

    return (
      <div className={`form-control w-full ${wrapperClassName || ""}`}>
        {label && (
          <label htmlFor={selectId} className="label">
            <span className="label-text font-medium">{label}</span>
          </label>
        )}
        <select
          id={selectId}
          ref={ref}
          className={`select select-bordered w-full focus:select-primary transition-all ${
            error ? "select-error" : ""
          } ${className || ""}`}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <label className="label">
            <span className="label-text-alt text-error">{error}</span>
          </label>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
