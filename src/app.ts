import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./route/auth";
import admin from "firebase-admin";
import {auth , db , bucket} from "./config/firebase";
import categoryRoutes from "./route/category";
import activityRoute from './route/activity'
// const serviceAccount = require("../finalproject-609a4-firebase-adminsdk-fbsvc-e4975b201d.json");
dotenv.config();

const app = express();
const PORT = process.env.PORT;

const serviceAccount = require("../finalproject-609a4-firebase-adminsdk-fbsvc-e4975b201d.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_BUCKET,
  });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/activity", activityRoute);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});
app.use(express.json());

// Error handler
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
    
  ) => {
    console.error(err.stack);
    res.status(500).json({ message: "Something went wrong!" });
  }
);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);

});

export default app;
