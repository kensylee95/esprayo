export const getStackConfig = (index: number, total: number) => ({
  rotate: (index - Math.floor(total / 2)) * 1.2,
  x: (index - Math.floor(total / 2)) * 2,
  y: -(index * 5),
  zIndex: index + 1,
});
