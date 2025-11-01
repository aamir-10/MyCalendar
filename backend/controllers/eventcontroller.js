// controllers/eventController.js
import Event from "../models/Event.js";

/**
 * GET /api/events
 * optional query:
 *   ?from=2025-11-01T00:00:00.000Z&to=2025-11-30T23:59:59.999Z
 * returns events (filtered by overlap if from/to provided)
 */
export const getEvents = async (req, res) => {
  try {
    const { from, to } = req.query;
    if (from || to) {
      // filter events that overlap with [from, to]
      const fromDate = from ? new Date(from) : new Date("1970-01-01");
      const toDate = to ? new Date(to) : new Date("3000-01-01");

      const events = await Event.find({
        $expr: {
          $and: [
            { $lte: [{ $toDate: "$start" }, toDate] },   // start <= to
            { $gte: [{ $toDate: "$end" }, fromDate] }    // end >= from
          ]
        }
      }).sort({ start: 1 });

      return res.json(events);
    } else {
      const events = await Event.find({}).sort({ start: 1 });
      return res.json(events);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getEventById = async (req, res) => {
  try {
    const ev = await Event.findById(req.params.id);
    if (!ev) return res.status(404).json({ message: "Event not found" });
    res.json(ev);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const createEvent = async (req, res) => {
  try {
    const { title, description = "", start, end, color = "#1976d2" } = req.body;

    if (!title || !start || !end) {
      return res.status(400).json({ message: "title, start and end are required" });
    }

    // basic validation: start <= end
    if (new Date(start) > new Date(end)) {
      return res.status(400).json({ message: "start must be before end" });
    }

    const ev = new Event({ title, description, start: new Date(start).toISOString(), end: new Date(end).toISOString(), color });
    await ev.save();
    res.status(201).json(ev);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateEvent = async (req, res) => {
  try {
    const ev = await Event.findById(req.params.id);
    if (!ev) return res.status(404).json({ message: "Event not found" });

    const { title, description, start, end, color } = req.body;

    if (title !== undefined) ev.title = title;
    if (description !== undefined) ev.description = description;
    if (start !== undefined) ev.start = new Date(start).toISOString();
    if (end !== undefined) ev.end = new Date(end).toISOString();
    if (color !== undefined) ev.color = color;
    ev.updatedAt = new Date();

    // validation
    if (ev.start && ev.end && new Date(ev.start) > new Date(ev.end)) {
      return res.status(400).json({ message: "start must be <= end" });
    }

    await ev.save();
    res.json(ev);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const ev = await Event.findById(req.params.id);
    if (!ev) return res.status(404).json({ message: "Event not found" });

    await Event.deleteOne({ _id: req.params.id });
    res.json({ message: "Event deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
