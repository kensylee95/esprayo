"use client";

import type React from "react";
import styles from "./NumericKeypad.module.scss";

type Props = {
  onKeyPress: (key: string) => void;
};

export const NumericKeyboard: React.FC<Props> = ({ onKeyPress }) => {
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];

  const alpha: Record<string, string> = {
    2: "ABC",
    3: "DEF",
    4: "GHI",
    5: "JKL",
    6: "MNO",
    7: "PQRS",
    8: "TUV",
    9: "WXYZ",
    0: "+",
  };

  return (
    <div className={styles.keypad}>
      {keys.map((k, i) => (
        <button
          type="button"
          key={i}
          className={styles.key}
          onClick={() => k && onKeyPress(k)}
        >
          {k && (
            <>
              <div className={styles.keyNum}>{k}</div>
              <div className={styles.keyAlpha}>{alpha[k] || ""}</div>
            </>
          )}
        </button>
      ))}
    </div>
  );
};
