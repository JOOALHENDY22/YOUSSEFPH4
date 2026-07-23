import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import interactionRoutes from './routes/interactionRoutes';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Basic health check route
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'YMH DRUG CHECK Backend is running.' });
});

// Routes
app.use('/api', interactionRoutes);

// Start server for local dev (Vercel will ignore this if we export app)
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
  });
}

// Export for Vercel Serverless
export default app;
