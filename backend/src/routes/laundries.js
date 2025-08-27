const express = require('express');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getPool } = require('../db');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

const uploadDir = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  },
});

const upload = multer({ storage });

router.get('/', async (req, res) => {
  const pool = getPool();
  try {
    const result = await pool.query('SELECT id, nama_laundry, alamat, foto, rating FROM owners ORDER BY nama_laundry ASC');
    return res.json(result.rows);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Internal error' });
  }
});

router.get('/:id', async (req, res) => {
  const pool = getPool();
  try {
    const result = await pool.query('SELECT id, nama_laundry, alamat, foto, rating FROM owners WHERE id=$1', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ message: 'Not found' });
    return res.json(result.rows[0]);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Internal error' });
  }
});

router.put(
  '/me',
  authRequired(['owner']),
  [body('nama_laundry').optional().isLength({ min: 2 }), body('alamat').optional().isLength({ min: 3 })],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { nama_laundry, alamat } = req.body;
    const pool = getPool();
    try {
      const result = await pool.query('UPDATE owners SET nama_laundry = COALESCE($1, nama_laundry), alamat = COALESCE($2, alamat) WHERE id=$3 RETURNING id, nama_laundry, alamat, foto, rating', [nama_laundry || null, alamat || null, req.user.id]);
      return res.json(result.rows[0]);
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: 'Internal error' });
    }
  }
);

router.post('/me/foto', authRequired(['owner']), upload.single('foto'), async (req, res) => {
  const pool = getPool();
  try {
    const filename = req.file ? req.file.filename : null;
    const urlPath = filename ? `/uploads/${filename}` : null;
    const result = await pool.query('UPDATE owners SET foto=$1 WHERE id=$2 RETURNING id, nama_laundry, alamat, foto, rating', [urlPath, req.user.id]);
    return res.json(result.rows[0]);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Internal error' });
  }
});

router.delete('/me', authRequired(['owner']), async (req, res) => {
  const pool = getPool();
  try {
    await pool.query('DELETE FROM owners WHERE id=$1', [req.user.id]);
    return res.json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Internal error' });
  }
});

module.exports = router;

