export const getBeadPosition = (index: number, value: number) => {
  if (value === 1) return { x: 50, y: 50 };
  if (value === 2) return index % 2 === 0 ? { x: 32, y: 50 } : { x: 68, y: 50 };
  if (value === 3) {
    return [
      { x: 50, y: 32 },
      { x: 32, y: 60 },
      { x: 68, y: 60 },
      { x: 50, y: 32 },
    ][index];
  }
  return [
    { x: 32, y: 32 },
    { x: 68, y: 32 },
    { x: 32, y: 68 },
    { x: 68, y: 68 },
  ][index];
};
