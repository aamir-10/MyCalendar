// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import eventRoutes from "./routes/eventRoutes.js";

dotenv.config();
const app = express();

// Middlewares
app.use(cors());
app.use(express.json()); // parse application/json

// Connect DB
connectDB();

// Routes
app.use("/api/events", eventRoutes);

// simple root
app.get("/", (req, res) => res.send("Calendar Backend is running"));

// start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
