"use client";

import type React from "react";
import styles from "./NumericKeypad.module.scss";

type Props = {
  onKeyPress: (key: string) => void;
  onClose: () => void;
};

export const NumericKeyboard: React.FC<Props> = ({ onKeyPress, onClose }) => {
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "close", "0", "⌫"];

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

  const handleClick = (key: string) => {
    if (key === "close") {
      onClose();
      return;
    }

    onKeyPress(key);
  };

  return (
    <div className={styles.keypad}>
      {keys.map((k, i) => (
        <button
          type="button"
          key={i}
          className={styles.key}
          onClick={() => handleClick(k)}
        >
          {k === "close" ? (
            <div className={styles.keyNum}>Close</div>
          ) : (
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
