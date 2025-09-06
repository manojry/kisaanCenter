import express from 'express';

const router = express.Router();

console.log('🔧 Simple product routes file loaded');

// Simple test routes without controller imports
router.get('/test', (req, res) => {
  console.log('🧪 Simple test route hit!');
  res.json({ message: 'Simple products test route working!' });
});

router.get('/', (req, res) => {
  console.log('🧪 Simple products list route hit!');
  res.json({ message: 'Products list - simplified', products: [] });
});

console.log('🔧 Simple product routes configured');

export const simpleProductRoutes = router;
