import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth";
import admin from "firebase-admin";
import {auth , db , bucket} from "./config/firebase";
import categoryRoutes from "./routes/category";
import activityRoute from './routes/activity'
// import defaultcategoryRoutes from "./routes/adminCategory";
// import defaultactivityRoutes from "./routes/adminActivity";
import expectationRoute from "./routes/exp_user"; 
import activityDetailRoutes from "./routes/act_detail";
import activityHistoryRoutes from "./routes/act_history";
// import reportRoutes from "./routes/report";
import userRoute from "./routes/users";
import path from "path";


// const serviceAccount = require("../finalproject-609a4-firebase-adminsdk-fbsvc-e4975b201d.json");
dotenv.config();

const app = express();
const PORT = process.env.PORT;

const serviceAccount = require("../finalproject-609a4-firebase-adminsdk-fbsvc-e4975b201d.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    // storageBucket: process.env.FIREBASE_BUCKET,
  });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/activity", activityRoute);
app.use("/api/expuser", expectationRoute); 
app.use("/api/activityDetail", activityDetailRoutes);
app.use("/api/activityHistory", activityHistoryRoutes);
app.use("/api/users", userRoute);

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
