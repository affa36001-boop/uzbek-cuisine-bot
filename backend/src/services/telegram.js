import dotenv from 'dotenv';
dotenv.config();

const token = process.env.BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${token}`;
const ADMIN_ID = process.env.ADMIN_TELEGRAM_ID || '8083248063';

// ── Вспомогательная функция отправки ──
async function tgFetch(method, body) {
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

// ── Кнопки для каждого статуса (только следующие шаги) ──
// Формат callback: setstatus:ORDER_DB_ID:NEW_STATUS
export function buildStatusKeyboard(orderId, currentStatus) {
  const id = orderId;

  const FLOWS = {
    accepted: [
      [{ text: '👨‍🍳 Начать готовить',    callback_data: `setstatus:${id}:preparing` }],
      [{ text: '❌ Отменить заказ',       callback_data: `setstatus:${id}:cancelled` }],
    ],
    preparing: [
      [{ text: '🔥 Готово, упаковываем', callback_data: `setstatus:${id}:cooking` }],
      [{ text: '❌ Отменить заказ',       callback_data: `setstatus:${id}:cancelled` }],
    ],
    cooking: [
      [{ text: '🚗 Передать курьеру',     callback_data: `setstatus:${id}:out_for_delivery` }],
      [{ text: '❌ Отменить заказ',        callback_data: `setstatus:${id}:cancelled` }],
    ],
    out_for_delivery: [
      [{ text: '✅ Заказ доставлен!',     callback_data: `setstatus:${id}:delivered` }],
      [{ text: '❌ Отменить заказ',        callback_data: `setstatus:${id}:cancelled` }],
    ],
    // Финальные статусы — кнопок нет
    delivered: [],
    cancelled: [],
  };

  const buttons = FLOWS[currentStatus] || [];
  return buttons.length > 0 ? { inline_keyboard: buttons } : null;
}

// ── Строка статуса для подписи ──
export function statusLine(status) {
  const LABELS = {
    accepted:         '📋 Статус: Принят',
    preparing:        '👨‍🍳 Статус: Готовится',
    cooking:          '🔥 Статус: Упаковываем',
    out_for_delivery: '🚗 Статус: В пути к клиенту',
    delivered:        '✅ Статус: Доставлен',
    cancelled:        '❌ Статус: Отменён',
  };
  return LABELS[status] || `Статус: ${status}`;
}

// ── Уведомление администратора о новом заказе ──
export const sendAdminNotification = async (order) => {
  if (!token || token === 'YOUR_NEW_BOT_TOKEN_HERE') return;

  const itemsArray = Array.isArray(order.items) ? order.items : JSON.parse(order.items || '[]');
  const itemsList = itemsArray.map(item =>
    `  • ${item.name} (${item.size || 'стд.'}) × ${item.quantity} = ${(item.price * item.quantity).toLocaleString('ru-RU')} сум`
  ).join('\n');

  const isPickup = order.delivery_type === 'pickup';
  const paymentLabels = { click: 'Click', payme: 'Payme', cash: 'Наличные' };
  const customerName = order.customer_name || `${order.first_name || ''} ${order.last_name || ''}`.trim() || 'Не указано';

  const lines = [
    `🆕 *${isPickup ? 'САМОВЫВОЗ' : 'ДОСТАВКА'} #${order.order_number}*`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `📦 *Тип:* ${isPickup ? 'Самовывоз' : 'Доставка'}`,
    `👤 *Имя:* ${customerName}`,
    `📞 *Телефон:* ${order.phone}`,
    `📍 *${isPickup ? 'Филиал' : 'Адрес'}:* ${order.delivery_address}`,
  ];

  if (!isPickup && order.location?.latitude && order.location?.longitude) {
    lines.push(`🌍 *Карта:* [Открыть](https://www.google.com/maps?q=${order.location.latitude},${order.location.longitude})`);
  }

  lines.push(
    '', `🛒 *Состав заказа:*`, itemsList, '',
    `💰 *Итого:* ${Number(order.total_amount).toLocaleString('ru-RU')} сум`,
    `💳 *Оплата:* ${paymentLabels[order.payment_method] || order.payment_method}`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `\n${statusLine('accepted')}`,
  );

  // Кнопки первого шага (заказ только что принят → "Начать готовить")
  const keyboard = buildStatusKeyboard(order.id, 'accepted');

  await tgFetch('sendMessage', {
    chat_id: ADMIN_ID,
    text: lines.join('\n'),
    parse_mode: 'Markdown',
    reply_markup: keyboard,
  });

  if (!isPickup && order.location?.latitude && order.location?.longitude) {
    await tgFetch('sendLocation', {
      chat_id: ADMIN_ID,
      latitude: order.location.latitude,
      longitude: order.location.longitude,
    });
  }

  console.log(`✅ Admin notification sent for order #${order.order_number}`);
};

// ── Редактирование сообщения: обновляем текст + кнопки после смены статуса ──
export const updateAdminMessage = async (chatId, messageId, order, newStatus) => {
  if (!token || !chatId || !messageId) return;

  const itemsArray = Array.isArray(order.items) ? order.items : JSON.parse(order.items || '[]');
  const itemsList = itemsArray.map(item =>
    `  • ${item.name} (${item.size || 'стд.'}) × ${item.quantity} = ${(item.price * item.quantity).toLocaleString('ru-RU')} сум`
  ).join('\n');

  const isPickup = order.delivery_type === 'pickup';
  const paymentLabels = { click: 'Click', payme: 'Payme', cash: 'Наличные' };
  const customerName = `${order.first_name || ''} ${order.last_name || ''}`.trim() || 'Клиент';

  const lines = [
    `${newStatus === 'cancelled' ? '🚫' : newStatus === 'delivered' ? '✅' : '📦'} *${isPickup ? 'САМОВЫВОЗ' : 'ДОСТАВКА'} #${order.order_number}*`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `📦 *Тип:* ${isPickup ? 'Самовывоз' : 'Доставка'}`,
    `👤 *Имя:* ${customerName}`,
    `📞 *Телефон:* ${order.phone}`,
    `📍 *${isPickup ? 'Филиал' : 'Адрес'}:* ${order.delivery_address}`,
    '', `🛒 *Состав заказа:*`, itemsList, '',
    `💰 *Итого:* ${Number(order.total_amount).toLocaleString('ru-RU')} сум`,
    `💳 *Оплата:* ${paymentLabels[order.payment_method] || order.payment_method}`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `\n${statusLine(newStatus)}`,
  ];

  const keyboard = buildStatusKeyboard(order.id, newStatus);

  // Редактируем текст сообщения
  await tgFetch('editMessageText', {
    chat_id: chatId,
    message_id: messageId,
    text: lines.join('\n'),
    parse_mode: 'Markdown',
    reply_markup: keyboard || { inline_keyboard: [] }, // пустой если финальный статус
  });
};

// ── Подтверждение заказа клиенту ──
export const sendOrderConfirmationToUser = async (chatId, order, lang = 'ru') => {
  if (!token || token === 'YOUR_NEW_BOT_TOKEN_HERE' || !chatId) return;

  const itemsArray = Array.isArray(order.items) ? order.items : JSON.parse(order.items || '[]');
  const itemsList = itemsArray.map(item => `• ${item.name} × ${item.quantity}`).join('\n');
  const isPickup = order.delivery_type === 'pickup';
  const paymentLabels = { click: 'Click', payme: 'Payme', cash: 'Наличные' };

  const text = [
    `✅ *Ваш заказ принят!*`,
    `С вами свяжутся в ближайшее время.`,
    ``,
    `📋 *Номер заказа:* \`#${order.order_number}\``,
    `🛍️ *Заказано:*`,
    itemsList,
    ``,
    `💰 *Итого:* ${Number(order.total_amount).toLocaleString('ru-RU')} сум`,
    `🏢 *${isPickup ? 'Самовывоз' : 'Адрес'}:* ${order.delivery_address}`,
    `💳 *Оплата:* ${paymentLabels[order.payment_method] || order.payment_method}`,
  ].join('\n');

  await tgFetch('sendMessage', { chat_id: chatId, text, parse_mode: 'Markdown' });
};

// ── Уведомление клиенту при каждой смене статуса ──
export const sendStatusUpdateToUser = async (chatId, orderNumber, newStatus) => {
  if (!token || token === 'YOUR_NEW_BOT_TOKEN_HERE' || !chatId) return;

  const STATUS_TEXTS = {
    preparing:        `👨‍🍳 *Заказ #${orderNumber} готовится!*\n\nНаши повара уже приступили. Скоро будет готово! ⏳`,
    cooking:          `🔥 *Заказ #${orderNumber} упаковывается!*\n\nОсталось совсем немного, уже почти готово!`,
    out_for_delivery: `🚗 *Заказ #${orderNumber} в пути!*\n\nКурьер уже едет к вам. Ожидайте! 📍`,
    delivered:        `✅ *Заказ #${orderNumber} доставлен!*\n\nПриятного аппетита! 😋\nСпасибо, что выбрали нас! 🙏`,
    cancelled:        `❌ *Заказ #${orderNumber} отменён.*\n\nЕсли возникли вопросы — свяжитесь с нами.`,
  };

  const text = STATUS_TEXTS[newStatus];
  if (!text) return; // accepted — не уведомляем (уже было при создании)

  await tgFetch('sendMessage', { chat_id: chatId, text, parse_mode: 'Markdown' });
  console.log(`📨 Status "${newStatus}" sent to user ${chatId} for order #${orderNumber}`);
};
