export const handleGetPoints = (
  id: string,
  receiptsDb: Record<string, { points: number }>
): number | null => {
  return receiptsDb[id]?.points || null;
};
