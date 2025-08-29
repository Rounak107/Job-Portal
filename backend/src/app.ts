import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import prisma from './prisma';
import userRoutes from './routes/userRoutes';
import jobRoutes from './routes/jobRoutes';
import applicationRoutes from './routes/applicationRoutes';
import path from 'path';
import recruiterRoutes from './routes/recruiterRoutes';
import testEmailRoutes from "./routes/testEmail";

dotenv.config(); // Load .env

const app = express();


const allowedOrigins = (process.env.FRONTEND_URLS || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim());

app.use(
  cors({
    origin: function (origin, callback) {
      // If no origin (like Postman, curl), allow it
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        console.warn(`❌ Blocked by CORS: ${origin}`);
        return callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);
// allow frontend dev origins (adjust as needed)
// app.use(cors({
//   origin: ['http://localhost:5173', 'http://localhost:3000', 'https://job-portal-frontend.onrender.com'], // vite default 5173, CRA 3000
//   credentials: true,
// }));

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/test-db', async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// Use routes
app.use('/api/users', userRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/api/recruiter', recruiterRoutes);
app.use("/api", testEmailRoutes);

app.get('/health', (req, res) => res.json({ ok: true }));

// 👇 ADD THIS BLOCK anywhere after middlewares but before app.listen
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, status: 'up' });
});

export default app;
