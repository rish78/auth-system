require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const userRoutes = require('./routes/userRoutes');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');
const connectDB = require('./config/db');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  standardHeaders: true, 
  legacyHeaders: false, 
});


connectDB();

const app = express();

app.use(express.json());
app.use(helmet());
app.use(cors());
app.use(morgan('tiny'));
app.use(limiter);

// Handle uncaught exceptions
process.on('uncaughtException', (ex) => {
    logger.error(`Uncaught Exception: ${ex.message}`, ex);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (ex) => {
    logger.error(`Unhandled Rejection: ${ex.message}`, ex);
    process.exit(1);
});

app.use('/api/users', userRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;