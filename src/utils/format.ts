export const formatMonto = (val: number | string | undefined | null): string => {
  const num = typeof val === 'string' ? parseFloat(val) : val || 0;
  if (Number.isInteger(num)) return num.toString();
  return num.toFixed(2).replace(/\.?0+$/, '');
};

export const formatHora = (hora: string | undefined | null): string => {
  if (!hora) return '-';
  const h = String(hora).split(':');
  const hours = parseInt(h[0], 10);
  const minutes = h[1];
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const h12 = hours % 12 || 12;
  return `${h12}:${minutes} ${ampm}`;
};
