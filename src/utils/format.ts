export const formatMonto = (val: number | string | undefined | null): string => {
  const num = typeof val === 'string' ? parseFloat(val) : val || 0;
  if (Number.isInteger(num)) return num.toString();
  return num.toFixed(2).replace(/\.?0+$/, '');
};
