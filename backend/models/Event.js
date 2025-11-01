// models/Event.js
import mongoose from "mongoose";

const EventSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  start: { type: String, required: true }, // store ISO string
  end: { type: String, required: true },   // store ISO string
  color: { type: String, default: "#1976d2" },
  createdAt: { type: Date, default: () => new Date() },
  updatedAt: { type: Date, default: () => new Date() }
});

// update updatedAt on save
EventSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const Event = mongoose.model("Event", EventSchema);
export default Event;
