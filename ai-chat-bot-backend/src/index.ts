import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import ttsRoutes from './routes/tts';
import chatRoutes from './routes/chat';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'http://localhost:3000';

// Middleware
app.use(express.json());
app.use(cors({
  origin: ALLOWED_ORIGIN,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Routes
app.use('/api/tts', ttsRoutes);
app.use('/api', chatRoutes);

// Serve cached audio files
app.use('/cache/audio', express.static('cache/audio'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Allowed origin: ${ALLOWED_ORIGIN}`);
});