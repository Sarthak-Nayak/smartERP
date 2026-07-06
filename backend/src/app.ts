import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/authRoutes';
import customerRoutes from './routes/customerRoutes';
import supplierRoutes from './routes/supplierRoutes';
import itemRoutes from './routes/itemRoutes';
import salesVoucherRoutes from './routes/salesVoucherRoutes';
import purchaseVoucherRoutes from './routes/purchaseVoucherRoutes';
import exportRoutes from './routes/exportRoutes';

dotenv.config();

const app = express();

// Configuration
app.use(cors());
app.use(express.json());

// Routes Mounts
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/sales-vouchers', salesVoucherRoutes);
app.use('/api/purchase-vouchers', purchaseVoucherRoutes);
app.use('/api/export', exportRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Fallback Route
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

export default app;
