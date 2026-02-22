import dotenv from 'dotenv';
dotenv.config();

import { orderQueries } from '../config/database.js';
import {
  sendStatusUpdateToUser,
  updateAdminMessage,
} from './telegram.js';

const token = process.env.BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${token}`;
const WEBAPP_URL = process.env.WEBAPP_URL || '';
const ADMIN_ID = process.env.ADMIN_TELEGRAM_ID || '8083248063';

const VALID_STATUSES = ['accepted', 'preparing', 'cooking', 'out_for_delivery', 'delivered', 'cancelled'];

const userLangs = {};

const LANGS = {
  ru: { flag: '🇷🇺', label: 'Русский' },
  uz: { flag: '🇺🇿', label: "O'zbekcha" },
  en: { flag: '🇬🇧', label: 'English' },
};

const messages = {
  ru: {
    welcome: (name) => `Ассалому алайкум, ${name}! 👋\nДобро пожаловать в нашу кухню.\nНажмите «🍽️ Меню», чтобы открыть каталог.`,
    langChanged: 'Язык изменён на Русский 🇷🇺',
    chooseLang: 'Выберите язык / Tilni tanlang:',
    menuBtn: '🍽️ Меню',
    langBtn: '🌐 Изменить язык',
  },
  uz: {
    welcome: (name) => `Assalomu alaykum, ${name}! 👋\nOshxonamizga xush kelibsiz.\n«🍽️ Menyu» tugmasini bosib katalogni oching.`,
    langChanged: "Til O'zbekchaga o'zgartirildi 🇺🇿",
    chooseLang: 'Tilni tanlang / Выберите язык:',
    menuBtn: '🍽️ Menyu',
    langBtn: "🌐 Tilni o'zgartirish",
  },
  en: {
    welcome: (name) => `Hello, ${name}! 👋\nWelcome to our kitchen.\nTap «🍽️ Menu» to open the catalog.`,
    langChanged: 'Language changed to English 🇬🇧',
    chooseLang: 'Choose language / Выберите язык:',
    menuBtn: '🍽️ Menu',
    langBtn: '🌐 Change language',
  },
};

function getLang(chatId) { return userLangs[chatId] || 'ru'; }
function getT(chatId) { return messages[getLang(chatId)] || messages.ru; }

function mainKeyboard(chatId) {
  const ln = getT(chatId);
  const keyboard = [];
  if (WEBAPP_URL) keyboard.push([{ text: ln.menuBtn, web_app: { url: WEBAPP_URL } }]);
  else keyboard.push([{ text: ln.menuBtn }]);
  keyboard.push([{ text: ln.langBtn }]);
  return { keyboard, resize_keyboard: true, one_time_keyboard: false };
}

function langInlineKeyboard() {
  return {
    inline_keyboard: Object.entries(LANGS).map(([code, { flag, label }]) => [
      { text: `${flag} ${label}`, callback_data: `set_lang_${code}` },
    ]),
  };
}

async function tgSend(method, body) {
  if (!token || token === 'YOUR_NEW_BOT_TOKEN_HERE') return null;
  try {
    const res = await fetch(`${TELEGRAM_API}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return await res.json();
  } catch (err) {
    console.error(`TG ${method} error:`, err.message);
    return null;
  }
}

// ══════════════════════════════════════
//  Обработка нажатий кнопок
// ══════════════════════════════════════
async function handleCallbackQuery(cb) {
  const chatId = cb.message?.chat?.id;
  const messageId = cb.message?.message_id;
  const data = cb.data || '';

  // ── Смена языка ──
  if (data.startsWith('set_lang_')) {
    const lang = data.replace('set_lang_', '');
    if (LANGS[lang]) {
      userLangs[chatId] = lang;
      await tgSend('answerCallbackQuery', { callback_query_id: cb.id });
      await tgSend('sendMessage', {
        chat_id: chatId,
        text: getT(chatId).langChanged,
        reply_markup: mainKeyboard(chatId),
      });
    }
    return;
  }

  // ── Смена статуса заказа: setstatus:ORDER_DB_ID:new_status ──
  if (data.startsWith('setstatus:')) {
    // Только администратор может менять статусы
    if (String(chatId) !== String(ADMIN_ID)) {
      await tgSend('answerCallbackQuery', {
        callback_query_id: cb.id,
        text: '⛔ Только администратор может менять статус',
        show_alert: true,
      });
      return;
    }

    const parts = data.split(':');
    // ['setstatus', orderId, newStatus]
    if (parts.length < 3) return;

    const orderId = parseInt(parts[1]);
    const newStatus = parts[2];

    if (!orderId || !VALID_STATUSES.includes(newStatus)) {
      await tgSend('answerCallbackQuery', {
        callback_query_id: cb.id,
        text: '❌ Неверный статус или ID заказа',
        show_alert: true,
      });
      return;
    }

    try {
      // 1. Обновляем статус в БД
      orderQueries.updateStatus.run(newStatus, orderId);
      const order = orderQueries.findById.get(orderId);

      if (!order) {
        await tgSend('answerCallbackQuery', {
          callback_query_id: cb.id,
          text: '❌ Заказ не найден в базе данных',
          show_alert: true,
        });
        return;
      }

      const STATUS_LABEL = {
        accepted:         '📋 Принят',
        preparing:        '👨‍🍳 Готовится',
        cooking:          '🔥 Упаковывается',
        out_for_delivery: '🚗 В пути',
        delivered:        '✅ Доставлен',
        cancelled:        '❌ Отменён',
      };

      // 2. Коротко подтверждаем нажатие
      await tgSend('answerCallbackQuery', {
        callback_query_id: cb.id,
        text: `#${order.order_number}: ${STATUS_LABEL[newStatus] || newStatus}`,
      });

      // 3. Редактируем исходное сообщение — обновляем текст и кнопки
      //    (показываем следующий возможный шаг ИЛИ убираем кнопки если финал)
      const orderForEdit = {
        ...order,
        items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items,
      };
      await updateAdminMessage(chatId, messageId, orderForEdit, newStatus);

      // 4. Уведомляем клиента (если у него есть telegram_id)
      if (order.telegram_id) {
        await sendStatusUpdateToUser(order.telegram_id, order.order_number, newStatus);
      }

      console.log(`🔄 Order #${order.order_number} → "${newStatus}" by admin`);

    } catch (err) {
      console.error('Status update error:', err.message);
      await tgSend('answerCallbackQuery', {
        callback_query_id: cb.id,
        text: '❌ Ошибка при обновлении статуса',
        show_alert: true,
      });
    }
    return;
  }
}

// ══════════════════════════════════════
//  Главный обработчик обновлений
// ══════════════════════════════════════
async function handleUpdate(update) {
  if (update.callback_query) {
    await handleCallbackQuery(update.callback_query);
    return;
  }

  const msg = update.message;
  if (!msg) return;

  const chatId = msg.chat.id;
  const text = (msg.text || '').trim();
  const firstName = msg.from?.first_name || '';

  if (text === '/start') {
    await tgSend('sendMessage', {
      chat_id: chatId,
      text: getT(chatId).welcome(firstName),
      reply_markup: mainKeyboard(chatId),
    });
    return;
  }

  const allLangBtns = Object.values(messages).map(m => m.langBtn);
  if (allLangBtns.includes(text)) {
    await tgSend('sendMessage', {
      chat_id: chatId,
      text: getT(chatId).chooseLang,
      reply_markup: langInlineKeyboard(),
    });
    return;
  }

  const allMenuBtns = Object.values(messages).map(m => m.menuBtn);
  if (allMenuBtns.includes(text) && !WEBAPP_URL) {
    await tgSend('sendMessage', {
      chat_id: chatId,
      text: '⚠️ WEBAPP_URL is not configured in .env',
    });
  }
}

export { handleUpdate as handleTelegramUpdate };

// ══════════════════════════════════════
//  Long Polling
// ══════════════════════════════════════
let pollingOffset = 0;
let pollingActive = false;

async function pollUpdates() {
  if (!token || token === 'YOUR_NEW_BOT_TOKEN_HERE') {
    console.warn('⚠️ BOT_TOKEN not set — bot polling disabled');
    return;
  }
  pollingActive = true;
  await tgSend('deleteWebhook', { drop_pending_updates: false });
  console.log('🤖 Telegram bot polling started');

  while (pollingActive) {
    try {
      const res = await fetch(`${TELEGRAM_API}/getUpdates?offset=${pollingOffset}&timeout=30`);
      const data = await res.json();
      if (data.ok && data.result?.length) {
        for (const update of data.result) {
          pollingOffset = update.update_id + 1;
          try { await handleUpdate(update); } catch (err) { console.error('Bot update error:', err.message); }
        }
      }
    } catch (err) {
      console.error('Polling error:', err.message);
      await new Promise(r => setTimeout(r, 5000));
    }
  }
}

export function startBotPolling() { pollUpdates(); }
export function stopBotPolling() { pollingActive = false; }
