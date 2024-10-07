import { mercadopagoRoutes } from './routes/mercadopagoRoutes';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { logger } from './utils/logger';

const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

// Routes
app.use('/api/mercadopago', mercadopagoRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

export default app;