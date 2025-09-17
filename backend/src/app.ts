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
import adminRoutes from './routes/adminRoutes';

dotenv.config(); // Load .env

const app = express();

// ✅ Use environment variable FRONTEND_URLS
const allowedOrigins = (process.env.FRONTEND_URLS || '')
  .split(',')
  .map(o => o.trim())
  .filter(o => o !== '');

// ✅ Allow localhost in dev
allowedOrigins.push('http://localhost:5173');

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // allow Postman
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

app.use(
  '/uploads',
  cors({ origin: '*' }),  // allow images to be fetched cross-origin
  express.static(path.join(__dirname, '../uploads'))
);

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/test-db', async (_req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use("/api/admin", adminRoutes);
app.use('/api/recruiter', recruiterRoutes);
app.use('/api', testEmailRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, status: 'up' });
});

export default app;
