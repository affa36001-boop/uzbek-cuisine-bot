import express from 'express';
import { orderQueries, userQueries } from '../config/database.js';
import { verifyTelegramWebApp, verifyAdmin } from '../middleware/auth.js';
import { body, validationResult } from 'express-validator';
import { sendAdminNotification, sendOrderConfirmationToUser } from '../services/telegram.js';

const router = express.Router();

function generateOrderNumber() {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `UZ${timestamp}${random}`;
}

router.post('/',
  verifyTelegramWebApp,
  [
    body('items').isArray().notEmpty(),
    body('total_amount').isInt({ min: 1 }),
    body('delivery_address').trim().notEmpty(),
    body('phone').matches(/^\+998\d{9}$/),
    body('payment_method').isIn(['click', 'payme', 'cash'])
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { items, total_amount, delivery_address, phone, payment_method, delivery_type, branch_id } = req.body;

      let user = userQueries.findByTelegramId.get(req.user.id.toString());
      if (!user) {
        if (process.env.NODE_ENV === 'development') {
          userQueries.create.run(req.user.id.toString(), req.user.first_name || 'Test', req.user.last_name || 'User', req.user.username || 'testuser', 'ru');
          user = userQueries.findByTelegramId.get(req.user.id.toString());
        } else {
          return res.status(404).json({ error: 'User not found' });
        }
      }

      let paymentStatus = 'pending';
      if (payment_method === 'click' || payment_method === 'payme') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        paymentStatus = 'paid';
      }

      const orderNumber = generateOrderNumber();
      const result = orderQueries.create.run(user.id, orderNumber, JSON.stringify(items), total_amount, delivery_address, phone, payment_method, 'accepted');
      const order = orderQueries.findById.get(result.lastInsertRowid);

      const orderForNotification = {
        ...order,
        items: JSON.parse(order.items),
        delivery_type: delivery_type || 'delivery',
        branch_id,
        location: req.body.location,
        customer_name: req.body.name || `${order.first_name || ''} ${order.last_name || ''}`.trim()
      };

      sendAdminNotification(orderForNotification);
      sendOrderConfirmationToUser(req.user.id.toString(), orderForNotification, req.body.lang || 'ru').catch(err => console.error('User confirmation send failed:', err));

      res.json({
        success: true,
        order: {
          id: order.id, order_number: order.order_number, items: JSON.parse(order.items),
          total_amount: order.total_amount, delivery_address: order.delivery_address, phone: order.phone,
          payment_method: order.payment_method, status: order.status, created_at: order.created_at,
          payment_status: paymentStatus, delivery_type: delivery_type || 'delivery'
        }
      });
    } catch (error) {
      console.error('Error creating order:', error);
      res.status(500).json({ error: 'Failed to create order' });
    }
  }
);

router.get('/track/:orderNumber', (req, res) => {
  try {
    const order = orderQueries.findByOrderNumber.get(req.params.orderNumber);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ order: { ...order, items: JSON.parse(order.items), customer_name: `${order.first_name} ${order.last_name}` } });
  } catch (error) { res.status(500).json({ error: 'Failed to fetch order' }); }
});

router.get('/my-orders', verifyTelegramWebApp, (req, res) => {
  try {
    const user = userQueries.findByTelegramId.get(req.user.id.toString());
    if (!user) return res.status(404).json({ error: 'User not found' });
    const orders = orderQueries.findByUserId.all(user.id);
    res.json({ orders: orders.map(o => ({ ...o, items: JSON.parse(o.items) })) });
  } catch (error) { res.status(500).json({ error: 'Failed to fetch orders' }); }
});

router.patch('/:id/status', verifyAdmin, (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['accepted', 'preparing', 'cooking', 'out_for_delivery', 'delivered', 'cancelled'];
    if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });
    orderQueries.updateStatus.run(status, req.params.id);
    const order = orderQueries.findById.get(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ order: { id: order.id, order_number: order.order_number, status: order.status, updated_at: order.updated_at } });
  } catch (error) { res.status(500).json({ error: 'Failed to update order' }); }
});

router.get('/admin/all', verifyAdmin, (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const orders = orderQueries.getAll.all(limit);
    res.json({ orders: orders.map(o => ({ ...o, items: JSON.parse(o.items), customer_name: `${o.first_name} ${o.last_name}` })) });
  } catch (error) { res.status(500).json({ error: 'Failed to fetch orders' }); }
});

router.patch('/admin/:id/status', verifyAdmin, (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['accepted', 'preparing', 'cooking', 'out_for_delivery', 'delivered', 'cancelled'];
    if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });
    orderQueries.updateStatus.run(status, req.params.id);
    const order = orderQueries.findById.get(req.params.id);
    res.json({ order: { id: order.id, order_number: order.order_number, status: order.status, updated_at: order.updated_at } });
  } catch (error) { res.status(500).json({ error: 'Failed to update order' }); }
});

router.get('/admin/stats', verifyAdmin, (req, res) => {
  try {
    const totalRevenue = orderQueries.getTotalRevenue.get();
    const orderCount = orderQueries.getOrderCount.get();
    res.json({ total_revenue: totalRevenue.total || 0, total_orders: orderCount.count || 0 });
  } catch (error) { res.status(500).json({ error: 'Failed to fetch statistics' }); }
});

export default router;
