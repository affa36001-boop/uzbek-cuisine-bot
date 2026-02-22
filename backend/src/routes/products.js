import express from 'express';
import { products, toppings, getProductById, getProductsByCategory, calculatePrice } from '../config/products.js';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const { category } = req.query;
    if (category) return res.json({ products: getProductsByCategory(category) });
    res.json({ products });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

router.get('/toppings/all', (req, res) => {
  try { res.json({ toppings }); }
  catch (error) { res.status(500).json({ error: 'Failed to fetch toppings' }); }
});

router.post('/calculate-price', (req, res) => {
  try {
    const { productId, size, toppings: selectedToppings } = req.body;
    res.json({ price: calculatePrice(productId, size, selectedToppings) });
  } catch (error) { res.status(500).json({ error: 'Failed to calculate price' }); }
});

router.get('/:id', (req, res) => {
  try {
    const product = getProductById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ product });
  } catch (error) { res.status(500).json({ error: 'Failed to fetch product' }); }
});

export default router;
