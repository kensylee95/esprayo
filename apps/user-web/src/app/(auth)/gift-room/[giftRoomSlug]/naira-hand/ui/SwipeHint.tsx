"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronUp } from "lucide-react";

export default function SwipeHint({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.4 }}
          style={{
            position: "absolute",
            bottom: "7%",
            left: 0,
            width: "100%",
            zIndex: 20,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
          }}
        >
          {/* Animated arrows */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            {[0, 1, 3].map((i) => (
              <motion.div
                key={i}
                animate={{ opacity: [0.2, 1, 0.2], y: [2, -2, 2] }}
                transition={{
                  duration: 1.4,
                  repeat: Infinity,
                  delay: i * 0.18,
                  ease: "easeInOut",
                }}
              >
                <ChevronUp size={14} color="#C9A84C" />
              </motion.div>
            ))}
          </div>

          <span
            style={{
              fontSize: 10,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(201,168,76,0.6)",
              fontWeight: 400,
            }}
          >
            Swipe to spray
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
