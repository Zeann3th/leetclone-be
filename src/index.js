import 'dotenv/config';
import './env.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import crypto from 'crypto';
import cookieParser from 'cookie-parser';
import { ipLimiter } from './middlewares/ratelimit.js';
import { v1Router, v2Router } from './routes/index.js';
import mongoose from 'mongoose';
import multer from 'multer';
import { isProduction } from './utils.js';

const app = express();
const port = process.env.PORT || 8000;

// Security
app.use(cors({
  origin: process.env.APP_URL || "http://localhost:5173",
  allowedHeaders: ["Content-Type", "Authorization", "Cache-Control", "x-csrf-token", "x-service-token"],
  credentials: true,
}));
app.use(helmet());

// Content-Type
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookies
app.use(cookieParser());

// Logger
app.use(morgan(":method :url :status - :response-time ms"));

// Endpoints
app.get("/healthz", (req, res) => {
  res.status(200).json({ message: "Server is Healthy" });
});

app.get("/csrf-token", (req, res) => {
  const csrfToken = crypto.randomUUID();
  res.cookie("_csrf", csrfToken, { httpOnly: true, secure: isProduction, path: "/", sameSite: isProduction ? "none" : "lax", partitioned: isProduction });
  res.status(200).json({ csrfToken });
});

app.use("/v1", ipLimiter, v1Router);
app.use("/v2", ipLimiter, v2Router);

app.use((err, req, res, next) => {
  if (err.name === "INVALID_FILE_TYPE") {
    return res.status(400).json({ error: err.message });
  }
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: "Something went wrong." });
});


mongoose.connect(process.env.MONGO_URI, {
  dbName: process.env.MONGO_DB_NAME
}).then(() => {
  app.listen(port, () => {
    console.log(`
    \x1b[35m\n 🚀 LeetBase 1.0.0\n\x1b[0m
    - Local:\thttp://localhost:${port}/
    
    Note that the development build is not optimized.
    To create a production build, use \x1b[32mnpm run start\x1b[0m.\n
  `);
  });
}).catch((error) => {
  console.log('Error: ', error);
});

