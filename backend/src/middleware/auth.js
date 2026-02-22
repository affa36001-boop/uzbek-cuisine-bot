import crypto from 'crypto';

export function verifyTelegramWebApp(req, res, next) {
  try {
    const initData = req.headers['x-telegram-init-data'];
    if (process.env.NODE_ENV === 'development' && !initData) {
      req.user = { id: 'dev_user', first_name: 'Test', last_name: 'User', username: 'testuser' };
      return next();
    }
    if (!initData) return res.status(401).json({ error: 'Unauthorized: No init data' });

    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    urlParams.delete('hash');

    const dataCheckArr = [];
    for (const [key, value] of urlParams.entries()) dataCheckArr.push(`${key}=${value}`);
    dataCheckArr.sort();
    const dataCheckString = dataCheckArr.join('\n');

    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(process.env.BOT_TOKEN).digest();
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    if (process.env.NODE_ENV === 'production' && hash !== calculatedHash) {
      return res.status(401).json({ error: 'Unauthorized: Invalid hash' });
    }

    const userParam = urlParams.get('user');
    if (userParam) req.user = JSON.parse(userParam);
    next();
  } catch (error) {
    console.error('Auth error:', error);
    if (process.env.NODE_ENV === 'development') {
      req.user = { id: 'dev_user', first_name: 'Test', last_name: 'User', username: 'testuser' };
      return next();
    }
    res.status(401).json({ error: 'Unauthorized' });
  }
}

export function verifyAdmin(req, res, next) {
  const password = req.headers['x-admin-password'];
  if (password !== process.env.ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

export default { verifyTelegramWebApp, verifyAdmin };
