// WizardInput.tsx
"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import styles from "./InputWithLabel.module.scss";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  focused?: boolean;
};

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, focused = false, ...props }, ref) => {
    return (
      <div className={styles.field}>
        <label htmlFor={label} className={styles.label}>
          {label}
        </label>
        <input
          ref={ref}
          className={`${styles.input} ${focused ? styles.focused : ""}`}
          {...props}
        />
      </div>
    );
  },
);

Input.displayName = "Input";

export default Input;
