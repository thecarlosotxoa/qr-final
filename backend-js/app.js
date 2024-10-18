// server.js
import express from 'express';
import session from 'express-session';
import bodyParser from 'body-parser';
import cors from 'cors';
import bcrypt from 'bcrypt';
import QRCode from 'qrcode';
// import { Pool } from 'pg';
import pkg from 'pg';
const { Pool } = pkg;

// Initialize Express
const app = express();

// Database connection (replace with your own credentials)
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'qr_final',
  password: 'admin0',
  port: 5432,
});

// Middleware setup
app.use(bodyParser.json());
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

// Session management
app.use(session({
  secret: 'your_secret_key',  // Change this for production
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false,  // Set to true if using HTTPS in production
    httpOnly: true,
    sameSite: 'none',  // Allows cross-origin
  },
}));

// Register user
app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists.' });
    }

    const newUser = await pool.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id',
      [name, email, hashedPassword]
    );

    // Set session
    req.session.userId = newUser.rows[0].id;
    res.status(201).json({ message: 'User registered successfully!', user: { id: newUser.rows[0].id, name, email } });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ error: 'An error occurred during registration.' });
  }
});

// User login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (user.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.rows[0].password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    req.session.userId = user.rows[0].id;  // Set session after login
    res.status(200).json({ message: 'Login successful!', user: { id: user.rows[0].id, name: user.rows[0].name, email: user.rows[0].email } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'An error occurred during login.' });
  }
});

// Logout user
app.post('/logout', (req, res) => {
  req.session.destroy();
  res.status(200).json({ message: 'Logged out successfully.' });
});

// Get user profile
app.get('/user/profile', async (req, res) => {
  if (!req.session.userId) {
    return res.status(403).json({ error: 'User not logged in' });
  }

  try {
    const user = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [req.session.userId]);
    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json(user.rows[0]);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'An error occurred while fetching profile.' });
  }
});

// Generate QR code
app.post('/generate-qr', async (req, res) => {
  const { data } = req.body;

  if (!data) {
    return res.status(400).json({ error: 'No data provided' });
  }

  try {
    const qrImage = await QRCode.toDataURL(data);

    // Save QR code for logged-in users
    if (req.session.userId) {
      await pool.query(
        'INSERT INTO qr_codes (user_id, qr_text, qr_image, timestamp) VALUES ($1, $2, $3, $4)',
        [req.session.userId, data, qrImage, new Date()]
      );
    }

    res.status(200).json({ qr_code: qrImage });
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ error: 'An error occurred while generating QR code.' });
  }
});

// Get generated QR codes for logged-in user
app.get('/user/qr-codes', async (req, res) => {
  if (!req.session.userId) {
    return res.status(403).json({ error: 'User not logged in' });
  }

  try {
    const qrCodes = await pool.query('SELECT id, qr_text, qr_image, timestamp FROM qr_codes WHERE user_id = $1 ORDER BY timestamp DESC', [req.session.userId]);
    res.status(200).json(qrCodes.rows);
  } catch (error) {
    console.error('Error fetching QR codes:', error);
    res.status(500).json({ error: 'An error occurred while fetching QR codes.' });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


export default app;