export function formatPrice(price) {
  return Number(price).toLocaleString('ru-RU') + ' сум';
}

export function validatePhoneNumber(phone) {
  return /^\+998\d{9}$/.test(phone);
}

export function hapticFeedback(type = 'light') {
  try {
    if (window.Telegram?.WebApp?.HapticFeedback) {
      if (type === 'success') window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      else if (type === 'error') window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
      else if (type === 'medium') window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
      else window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
  } catch (e) {}
}

export function initTelegramWebApp() {
  try {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
      window.Telegram.WebApp.enableClosingConfirmation();
    }
  } catch (e) { console.error('Failed to init Telegram WebApp:', e); }
}
