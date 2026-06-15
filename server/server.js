import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import urlRoutes from './routes/urls.js';
import redirectRoutes from './routes/redirect.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
app.use(cors());
app.use(express.json());

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/urls', urlRoutes);
app.use('/r', redirectRoutes); // Server-side redirect endpoint

// API Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Space Shortener Backend API is operational' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: 'Something went wrong on the spaceship. Please try again.' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Space-Shortener Server launched and cruising on port ${PORT}`);
});
