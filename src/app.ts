import { mercadopagoRoutes } from './routes/mercadopagoRoutes';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { logger } from './utils/logger';
import { paymentRoutes } from './routes/paymentRoutes';

const app = express();

// Middleware
// Cors para prevenir accesos no autorizados y permite solicitudes desde el frontend
app.use(cors());
// Helmet ayuda a proteger la app de ataques (XXS, clickjacking, etc)
app.use(helmet());
// Express.json para parsear el body de las peticiones
app.use(express.json());
// Morgan para ver las peticiones http en la consola
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

// Routes
app.use('/api/mercadopago', mercadopagoRoutes);
app.use('/api/payments', paymentRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

export default app;