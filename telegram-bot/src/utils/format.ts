export function formatMonto(monto: number | string): string {
  return `${Number(monto).toFixed(2)} CUP`;
}

export function formatHora(hora: string): string {
  if (!hora) return '';
  const parts = hora.split(':');
  if (parts.length >= 2) {
    let h = parseInt(parts[0]);
    const m = parts[1];
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${m} ${ampm}`;
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
