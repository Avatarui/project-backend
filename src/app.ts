import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";

// Import routes
import authRoutes from "./routes/auth";
import categoryRoutes from "./routes/category";
import activityRoute from './routes/activity';
import expectationRoute from "./routes/exp_user"; 
import activityDetailRoutes from "./routes/act_detail";
import activityHistoryRoutes from "./routes/act_history";
import userRoute from "./routes/users";
import actionlogRoutes from "./routes/actionLog";

// Import Firebase Admin SDK instances
import { auth, db, bucket } from "./config/firebase";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
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
app.use("/api/actionlog",actionlogRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});

export default app;
