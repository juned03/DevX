import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { prisma } from './config/db.js';
import policyRoutes from './routes/policyRoutes.js';
import claimRoutes from './routes/claimRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import underwritingRoutes from './routes/underwritingRoutes.js';
import reportRoutes from './routes/reportRoutes.js';

dotenv.config();
const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok' });
  } catch (e) {
    res.status(500).json({ status: 'error' });
  }
});

app.use('/api/policies', policyRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/underwriting', underwritingRoutes);
app.use('/api/reports', reportRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal Server Error' });
});

export default app;


