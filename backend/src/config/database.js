import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = process.env.DATABASE_PATH || join(__dirname, '../../database.sqlite');
const db = new Database(dbPath);

db.pragma('foreign_keys = ON');

export let userQueries;
export let orderQueries;

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_id TEXT UNIQUE NOT NULL,
      first_name TEXT,
      last_name TEXT,
      username TEXT,
      language_code TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      order_number TEXT UNIQUE NOT NULL,
      items TEXT NOT NULL,
      total_amount INTEGER NOT NULL,
      delivery_address TEXT NOT NULL,
      phone TEXT NOT NULL,
      payment_method TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
    CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
  `);

  userQueries = {
    create: db.prepare(`
      INSERT INTO users (telegram_id, first_name, last_name, username, language_code)
      VALUES (?, ?, ?, ?, ?)
    `),
    findByTelegramId: db.prepare(`SELECT * FROM users WHERE telegram_id = ?`),
    getAll: db.prepare(`SELECT * FROM users ORDER BY created_at DESC`)
  };

  orderQueries = {
    create: db.prepare(`
      INSERT INTO orders (user_id, order_number, items, total_amount, delivery_address, phone, payment_method, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `),
    findById: db.prepare(`
      SELECT o.*, u.first_name, u.last_name, u.telegram_id
      FROM orders o JOIN users u ON o.user_id = u.id WHERE o.id = ?
    `),
    findByOrderNumber: db.prepare(`
      SELECT o.*, u.first_name, u.last_name, u.telegram_id
      FROM orders o JOIN users u ON o.user_id = u.id WHERE o.order_number = ?
    `),
    findByUserId: db.prepare(`SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC`),
    getAll: db.prepare(`
      SELECT o.*, u.first_name, u.last_name, u.username
      FROM orders o JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC LIMIT ?
    `),
    updateStatus: db.prepare(`UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`),
    getTotalRevenue: db.prepare(`SELECT SUM(total_amount) as total FROM orders WHERE status = 'delivered'`),
    getOrderCount: db.prepare(`SELECT COUNT(*) as count FROM orders`)
  };

  console.log('✅ Database initialized successfully');
}

export default db;
