const express = require('express');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { getPool } = require('../db');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

// Customer can rate completed order once
router.post(
  '/:id/rating',
  authRequired(['customer']),
  [body('rating').isInt({ min: 1, max: 5 }), body('comment').optional().isString()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { id } = req.params;
    const { rating, comment } = req.body;
    const pool = getPool();
    try {
      const orderRes = await pool.query('SELECT * FROM orders WHERE id=$1 AND customer_id=$2', [id, req.user.id]);
      if (orderRes.rowCount === 0) return res.status(404).json({ message: 'Order not found' });
      const order = orderRes.rows[0];
      if (order.status !== 'completed') return res.status(400).json({ message: 'Order not completed' });
      // upsert rating (unique by order_id)
      const { v4: uuidv4 } = require('uuid');
      const ratingId = uuidv4();
      await pool.query(
        `INSERT INTO owner_ratings (id, order_id, owner_id, customer_id, rating, comment)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT (order_id) DO UPDATE SET rating=EXCLUDED.rating, comment=EXCLUDED.comment` ,
        [ratingId, order.id, order.owner_id, order.customer_id, rating, comment || null]
      );
      // update owner's average rating
      const avgRes = await pool.query('SELECT COALESCE(AVG(rating),0)::numeric(3,2) as avg FROM owner_ratings WHERE owner_id=$1', [order.owner_id]);
      await pool.query('UPDATE owners SET rating=$1 WHERE id=$2', [avgRes.rows[0].avg, order.owner_id]);
      return res.json({ ok: true });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: 'Internal error' });
    }
  }
);

router.post(
  '/',
  authRequired(['customer']),
  [body('owner_id').isUUID(), body('catatan').optional().isString()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { owner_id, catatan } = req.body;
    const pool = getPool();
    try {
      const id = uuidv4();
      const result = await pool.query(
        'INSERT INTO orders (id, customer_id, owner_id, status, catatan) VALUES ($1,$2,$3,$4,$5) RETURNING *',
        [id, req.user.id, owner_id, 'pending', catatan || null]
      );
      return res.status(201).json(result.rows[0]);
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: 'Internal error' });
    }
  }
);

router.get('/me', authRequired(['customer']), async (req, res) => {
  const pool = getPool();
  try {
    const result = await pool.query(
      `SELECT o.*, ow.nama_laundry FROM orders o
       JOIN owners ow ON ow.id = o.owner_id
       WHERE customer_id=$1 ORDER BY created_at DESC`,
      [req.user.id]
    );
    return res.json(result.rows);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Internal error' });
  }
});

router.get('/incoming', authRequired(['owner']), async (req, res) => {
  const pool = getPool();
  try {
    const result = await pool.query(
      `SELECT o.*, c.nama as customer_nama FROM orders o
       JOIN customers c ON c.id = o.customer_id
       WHERE owner_id=$1 ORDER BY created_at DESC`,
      [req.user.id]
    );
    return res.json(result.rows);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Internal error' });
  }
});

router.patch(
  '/:id/status',
  authRequired(['owner']),
  [body('status').isIn(['pending', 'accepted', 'processing', 'completed', 'cancelled'])],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { id } = req.params;
    const { status } = req.body;
    const pool = getPool();
    try {
      const result = await pool.query(
        `UPDATE orders SET status=$1, updated_at=NOW() WHERE id=$2 AND owner_id=$3 RETURNING *`,
        [status, id, req.user.id]
      );
      if (result.rowCount === 0) return res.status(404).json({ message: 'Order not found' });
      return res.json(result.rows[0]);
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: 'Internal error' });
    }
  }
);

module.exports = router;

