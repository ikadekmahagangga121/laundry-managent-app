const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { initDb } = require('./db');
const authRoutes = require('./routes/auth');
const laundryRoutes = require('./routes/laundries');
const orderRoutes = require('./routes/orders');

const app = express();

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(morgan('dev'));
// Optional HTTPS redirect for production
if (process.env.FORCE_HTTPS === 'true') {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect('https://' + req.headers.host + req.url);
    }
    next();
  });
}
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

app.get('/', (req, res) => {
  res.json({ ok: true, name: 'Laundry Management API' });
});

app.use('/auth', authRoutes);
app.use('/laundries', laundryRoutes);
app.use('/orders', orderRoutes);

const PORT = process.env.PORT || 3000;

initDb()
  .then(() => {
    app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('Failed to init DB', err);
    process.exit(1);
  });

