import 'dotenv/config';
import { Bot } from 'grammy';

// Import handlers
import { registerStartHandlers } from './handlers/start.js';
import { registerDashboardHandlers } from './handlers/dashboard.js';
import { registerApuestasHandlers } from './handlers/apuestas.js';
import { registerHistorialHandlers } from './handlers/historial.js';
import { registerResultadosHandlers } from './handlers/resultados.js';
import { registerAcreditacionHandlers } from './handlers/acreditacion.js';
import { registerExtraccionHandlers } from './handlers/extraccion.js';
import { registerPerfilHandlers } from './handlers/perfil.js';

// Import admin handlers
import { registerAdminPanelHandlers } from './handlers/admin/panel.js';
import { registerAdminUsuariosHandlers } from './handlers/admin/usuarios.js';
import { registerAdminApuestasHandlers } from './handlers/admin/apuestas.js';
import { registerAdminAcreditacionesHandlers } from './handlers/admin/acreditaciones.js';
import { registerAdminExtraccionesHandlers } from './handlers/admin/extracciones.js';
import { registerAdminLoteriasHandlers } from './handlers/admin/loterias.js';
import { registerAdminTiradasHandlers } from './handlers/admin/tiradas.js';
import { registerAdminResultadosHandlers } from './handlers/admin/resultados.js';
import { registerAdminModalidadesHandlers } from './handlers/admin/modalidades.js';

const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error('❌ BOT_TOKEN no configurado. Agrega tu token en el archivo .env');
  process.exit(1);
}

const bot = new Bot(BOT_TOKEN);

// Register user handlers
registerStartHandlers(bot);
registerDashboardHandlers(bot);
registerApuestasHandlers(bot);
registerHistorialHandlers(bot);
registerResultadosHandlers(bot);
registerAcreditacionHandlers(bot);
registerExtraccionHandlers(bot);
registerPerfilHandlers(bot);

// Register admin handlers
registerAdminPanelHandlers(bot);
registerAdminUsuariosHandlers(bot);
registerAdminApuestasHandlers(bot);
registerAdminAcreditacionesHandlers(bot);
registerAdminExtraccionesHandlers(bot);
registerAdminLoteriasHandlers(bot);
registerAdminTiradasHandlers(bot);
registerAdminResultadosHandlers(bot);
registerAdminModalidadesHandlers(bot);

// Error handling
bot.catch((err) => {
  console.error('Error en el bot:', err.error);
});

// Start the bot
console.log('🎰 Bot de Lotería iniciando...');
bot.start({
  onStart: (info) => {
    console.log(`✅ Bot conectado como @${info.username}`);
    console.log(`📱 Usa /start para comenzar en Telegram`);
  },
});
