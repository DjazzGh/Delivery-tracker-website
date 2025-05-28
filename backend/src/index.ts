import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import authRoutes from './routes/auth'; // Import the auth routes


dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI as string); // Remove deprecated options
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Middleware to parse JSON bodies
app.use(express.json());

// Mount the auth routes
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.send('Backend is running');
});

io.on('connection', (socket) => {
  console.log('A user connected');
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

server.listen(5001, () => {
  console.log('Server running on http://localhost:5001');
});