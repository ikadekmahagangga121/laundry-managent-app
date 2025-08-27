const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { getPool } = require('../db');
const { signToken } = require('../middleware/auth');

const router = express.Router();

router.post(
  '/register-owner',
  [
    body('nama_laundry').isLength({ min: 2 }),
    body('alamat').isLength({ min: 3 }),
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
    body('foto').optional().isString(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { nama_laundry, alamat, email, password, foto } = req.body;
    const pool = getPool();
    try {
      const hashed = await bcrypt.hash(password, 10);
      const id = uuidv4();
      await pool.query(
        'INSERT INTO owners (id, nama_laundry, alamat, email, password, foto) VALUES ($1,$2,$3,$4,$5,$6)',
        [id, nama_laundry, alamat, email, hashed, foto || null]
      );
      return res.status(201).json({ id, nama_laundry, alamat, email, foto: foto || null });
    } catch (e) {
      if (e.code === '23505') return res.status(409).json({ message: 'Email already used' });
      console.error(e);
      return res.status(500).json({ message: 'Internal error' });
    }
  }
);

router.post(
  '/register-customer',
  [
    body('nama').isLength({ min: 2 }),
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
    body('no_hp').isLength({ min: 6 }),
    body('alamat').isLength({ min: 3 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { nama, email, password, no_hp, alamat } = req.body;
    const pool = getPool();
    try {
      const hashed = await bcrypt.hash(password, 10);
      const id = uuidv4();
      await pool.query(
        'INSERT INTO customers (id, nama, email, password, no_hp, alamat) VALUES ($1,$2,$3,$4,$5,$6)',
        [id, nama, email, hashed, no_hp, alamat]
      );
      return res.status(201).json({ id, nama, email, no_hp, alamat });
    } catch (e) {
      if (e.code === '23505') return res.status(409).json({ message: 'Email already used' });
      console.error(e);
      return res.status(500).json({ message: 'Internal error' });
    }
  }
);

router.post(
  '/login',
  [body('email').isEmail(), body('password').isLength({ min: 6 })],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { email, password, role } = req.body; // role: 'owner' | 'customer'
    const pool = getPool();
    try {
      let table = role === 'owner' ? 'owners' : 'customers';
      const result = await pool.query(`SELECT * FROM ${table} WHERE email=$1`, [email]);
      if (result.rowCount === 0) return res.status(401).json({ message: 'Invalid credentials' });
      const user = result.rows[0];
      const ok = await bcrypt.compare(password, user.password);
      if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
      const token = signToken({ id: user.id, role: role === 'owner' ? 'owner' : 'customer', email: user.email });
      return res.json({ token, role: role === 'owner' ? 'owner' : 'customer' });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: 'Internal error' });
    }
  }
);

module.exports = router;

