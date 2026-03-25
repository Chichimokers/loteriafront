import { InlineKeyboard, Keyboard } from 'grammy';

// Main menu keyboard (persistent)
export const mainMenuKeyboard = new Keyboard()
  .text('🎰 Apostar').text('📊 Resultados')
  .row()
  .text('💰 Saldo').text('📋 Historial')
  .row()
  .text('💳 Acreditar').text('💸 Extraer')
  .row()
  .text('👤 Perfil')
  .resized()
  .persistent();

// Admin menu keyboard
export const adminMenuKeyboard = new Keyboard()
  .text('🎰 Apostar').text('📊 Resultados')
  .row()
  .text('💰 Saldo').text('📋 Historial')
  .row()
  .text('💳 Acreditar').text('💸 Extraer')
  .row()
  .text('👤 Perfil').text('🔧 Admin')
  .row()
  .resized()
  .persistent();

// Admin panel keyboard
export function adminPanelKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text('📊 Métricas', 'admin:metricas')
    .text('👤 Usuarios', 'admin:usuarios')
    .row()
    .text('💳 Acreditaciones', 'admin:acreditaciones')
    .text('💸 Extracciones', 'admin:extracciones')
    .row()
    .text('🎲 Resultados', 'admin:resultados')
    .text('🎰 Loterías', 'admin:loterias')
    .row()
    .text('⏰ Tiradas', 'admin:tiradas')
    .text('📐 Modalidades', 'admin:modalidades')
    .row()
    .text('📝 Todas Apuestas', 'admin:apuestas');
}

// Inline keyboard for lotteries list
export function loteriasKeyboard(loterias: any[], prefix: string = 'lot'): InlineKeyboard {
  const kb = new InlineKeyboard();
  for (const lot of loterias) {
    kb.text(lot.nombre, `${prefix}:${lot.id}`).row();
  }
  return kb;
}

// Inline keyboard for tiradas (draws) grouped by loteria
export function tiradasKeyboard(tiradas: any[], prefix: string = 'tir'): InlineKeyboard {
  const kb = new InlineKeyboard();
  for (const t of tiradas) {
    const estado = t.resultado_hoy ? '✅' : (t.activa ? '🟢' : '🔴');
    const loteria = t.loteria_nombre || '';
    kb.text(`${estado} ${loteria} - ${t.hora}`, `${prefix}:${t.id}`).row();
  }
  return kb;
}

// Inline keyboard for modalidades
export function modalidadesKeyboard(modalidades: any[], prefix: string = 'mod'): InlineKeyboard {
  const kb = new InlineKeyboard();
  for (const m of modalidades) {
    kb.text(`${m.nombre} (${m.premio_por_peso}x)`, `${prefix}:${m.id}`).row();
  }
  return kb;
}

// Inline keyboard for tarjetas
export function tarjetasKeyboard(tarjetas: any[], prefix: string = 'tar'): InlineKeyboard {
  const kb = new InlineKeyboard();
  for (const t of tarjetas) {
    const masked = t.numero ? `**** ${t.numero.slice(-4)}` : 'N/A';
    kb.text(`${masked} - ${t.banco}`, `${prefix}:${t.id}`).row();
  }
  return kb;
}

// Pagination keyboard
export function paginationKeyboard(prefix: string, page: number, totalPages: number): InlineKeyboard {
  const kb = new InlineKeyboard();
  if (page > 1) {
    kb.text('⬅️ Anterior', `${prefix}:page:${page - 1}`);
  }
  kb.text(`${page}/${totalPages}`, 'noop');
  if (page < totalPages) {
    kb.text('Siguiente ➡️', `${prefix}:page:${page + 1}`);
  }
  return kb;
}

// Yes/No inline keyboard
export function yesNoKeyboard(prefix: string): InlineKeyboard {
  return new InlineKeyboard()
    .text('✅ Sí', `${prefix}:yes`)
    .text('❌ No', `${prefix}:no`);
}

// Banks keyboard
export const banksKeyboard = new InlineKeyboard()
  .text('Metropolitano', 'bank:Metropolitano').row()
  .text('Bandec', 'bank:Bandec').row()
  .text('BPA', 'bank:BPA').row()
  .text('Banco de Cuba', 'bank:Banco de Cuba');

// Acreditacion/Extraccion approve/reject keyboard
export function approveRejectKeyboard(type: string, id: number): InlineKeyboard {
  return new InlineKeyboard()
    .text('✅ Aprobar', `${type}:approve:${id}`)
    .text('❌ Rechazar', `${type}:reject:${id}`);
}
