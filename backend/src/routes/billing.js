const express = require('express');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { getPool } = require('../db');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

// Get billing info
router.get('/me', authRequired(['owner']), async (req, res) => {
  const pool = getPool();
  const { rows } = await pool.query('SELECT id, plan, plan_expiry, wallet_balance FROM owners WHERE id=$1', [req.user.id]);
  if (rows.length === 0) return res.status(404).json({ message: 'Not found' });
  res.json(rows[0]);
});

// Change plan (requires sufficient wallet_balance)
router.post('/plan', authRequired(['owner']), [body('plan').isIn(['free','pro','professional'])], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { plan } = req.body;
  const pool = getPool();
  // Simple pricing
  const priceMap = { free: 0, pro: 50000, professional: 150000 };
  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const ownerRes = await client.query('SELECT wallet_balance FROM owners WHERE id=$1 FOR UPDATE', [req.user.id]);
      if (ownerRes.rowCount === 0) throw new Error('owner not found');
      const balance = Number(ownerRes.rows[0].wallet_balance);
      const price = priceMap[plan] || 0;
      if (price > 0 && balance < price) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Saldo tidak cukup' });
      }
      let expiry = null;
      if (plan !== 'free') {
        expiry = new Date();
        expiry.setMonth(expiry.getMonth() + 1); // 1 month
      }
      const newBalance = balance - price;
      await client.query('UPDATE owners SET plan=$1, plan_expiry=$2, wallet_balance=$3 WHERE id=$4', [plan, expiry, newBalance, req.user.id]);
      await client.query('COMMIT');
      return res.json({ ok: true, plan, plan_expiry: expiry, wallet_balance: newBalance });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Internal error' });
  }
});

// Initiate top-up (simulate QR)
router.post('/topup', authRequired(['owner']), [body('amount').isInt({ min: 1000 }), body('method').optional().isIn(['qris','manual'])], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { amount, method = 'qris' } = req.body;
  const pool = getPool();
  const id = uuidv4();
  const reference = `TP-${Date.now()}-${Math.floor(Math.random()*10000)}`;
  await pool.query('INSERT INTO topups (id, owner_id, amount, method, status, reference) VALUES ($1,$2,$3,$4,$5,$6)', [id, req.user.id, amount, method, 'pending', reference]);
  // simulate QR: use external QR service with reference encoded
  const qrText = encodeURIComponent(`TOPUP:${reference}|AMOUNT:${amount}|OWNER:${req.user.id}`);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${qrText}`;
  return res.status(201).json({ id, reference, amount, method, status: 'pending', qrUrl });
});

// Simulate payment success (would be callback in real-life)
router.post('/topup/:id/confirm', authRequired(['owner']), async (req, res) => {
  const { id } = req.params;
  const pool = getPool();
  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const tRes = await client.query('SELECT * FROM topups WHERE id=$1 AND owner_id=$2 FOR UPDATE', [id, req.user.id]);
      if (tRes.rowCount === 0) { await client.query('ROLLBACK'); return res.status(404).json({ message: 'Topup not found' }); }
      const t = tRes.rows[0];
      if (t.status === 'paid') { await client.query('ROLLBACK'); return res.json({ ok: true }); }
      await client.query('UPDATE topups SET status=$1 WHERE id=$2', ['paid', id]);
      await client.query('UPDATE owners SET wallet_balance = wallet_balance + $1 WHERE id=$2', [t.amount, req.user.id]);
      await client.query('COMMIT');
      return res.json({ ok: true });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Internal error' });
  }
});

module.exports = router;

