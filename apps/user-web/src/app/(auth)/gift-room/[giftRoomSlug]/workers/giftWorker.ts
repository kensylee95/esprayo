let pendingAmount = 0;
let noteValue = 0;
let timer: ReturnType<typeof setTimeout> | null = null;

self.onmessage = (e) => {
  const { type, data } = e.data;

  if (type === "spray") {
    pendingAmount += data.noteValue * data.numberSent;
    noteValue = data.noteValue;

    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      if (pendingAmount > 0) {
        self.postMessage({
          type: "flush",
          amount: pendingAmount,
          noteValue,
        });
        pendingAmount = 0;
      }
      timer = null;
    }, 300);
  }

  if (type === "reset") {
    pendingAmount = 0;
    if (timer) clearTimeout(timer);
  }
};
