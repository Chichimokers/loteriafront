export function formatMonto(monto: number): string {
  return `${monto.toFixed(2)} CUP`;
}

export function formatHora(hora: string): string {
  if (!hora) return '';
  const parts = hora.split(':');
  if (parts.length >= 2) {
    return `${parts[0]}:${parts[1]}`;
  }
  return hora;
}

export function formatDate(fecha: string): string {
  if (!fecha) return '';
  try {
    const d = new Date(fecha);
    return d.toLocaleDateString('es-CU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return fecha;
  }
}

export function escapeMarkdown(text: string): string {
  return text.replace(/([_*\[\]()~`>#+\-=|{}.!])/g, '\\$1');
}
