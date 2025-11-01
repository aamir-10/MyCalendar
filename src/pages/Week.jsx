import React, { useState } from "react";
import {
  format, startOfWeek, addDays, isToday, setHours, setMinutes, parseISO
} from "date-fns";
import { useEvents } from "../context/EventContext";
import DateTimePicker from "react-datetime-picker";
import "react-datetime-picker/dist/DateTimePicker.css";
import "react-calendar/dist/Calendar.css";
import "react-clock/dist/Clock.css";

export default function Week() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const { events, addEvent, updateEvent, deleteEvent, fetchEvents } = useEvents();

  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [hoveredEvent, setHoveredEvent] = useState(null); // 👈 for tooltip
  const [form, setForm] = useState({
    title: "",
    description: "",
    start: "",
    end: "",
    color: "#1976d2",
  });

  const start = startOfWeek(currentWeek, { weekStartsOn: 0 });
  const days = [...Array(7)].map((_, i) => addDays(start, i));
  const hours = [...Array(24)].map((_, i) => i);

  const openCreateModal = (day, hour) => {
    const s = setMinutes(setHours(day, hour), 0);
    const e = setMinutes(setHours(day, hour + 1), 0);
    setEditingEvent(null);
    setForm({ title: "", description: "", start: s, end: e, color: "#1976d2" });
    setShowModal(true);
  };

  const openEditModal = (ev) => {
    setEditingEvent(ev);
    setForm({
      title: ev.title,
      description: ev.description || "",
      start: new Date(ev.start),
      end: new Date(ev.end),
      color: ev.color || "#1976d2",
    });
    setShowModal(true);
  };

  const saveEvent = async () => {
    const payload = {
      title: form.title,
      description: form.description,
      start: new Date(form.start).toISOString(),
      end: new Date(form.end).toISOString(),
      color: form.color,
    };

    if (editingEvent) {
      await updateEvent(editingEvent._id || editingEvent.id, payload);
    } else {
      await addEvent(payload);
    }

    await fetchEvents();
    closeModal();
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingEvent(null);
  };

  const removeEvent = async () => {
    if (editingEvent) {
      await deleteEvent(editingEvent._id || editingEvent.id);
      await fetchEvents();
    }
    closeModal();
  };

  const getEventsForHour = (day, hour) => {
    return events.filter((ev) => {
      const start = parseISO(ev.start);
      const end = parseISO(ev.end);

      const isSameDate =
        start.getFullYear() === day.getFullYear() &&
        start.getMonth() === day.getMonth() &&
        start.getDate() === day.getDate();

      if (!isSameDate) return false;

      const slotStart = setMinutes(setHours(day, hour), 0);
      const slotEnd = setMinutes(setHours(day, hour), 59);
      return start <= slotEnd && end >= slotStart;
    });
  };

  return (
    <div style={{ padding: 10 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
        <button onClick={() => setCurrentWeek(new Date())} style={btn}>Today</button>
        <button onClick={() => setCurrentWeek(addDays(currentWeek, -7))} style={btnSmall}>◀</button>
        <button onClick={() => setCurrentWeek(addDays(currentWeek, 7))} style={btnSmall}>▶</button>
        <h2 style={{ marginLeft: "10px", fontSize: "18px", fontWeight: "600" }}>
          {format(start, "MMM d")} - {format(addDays(start, 6), "MMM d yyyy")}
        </h2>
      </div>

      {/* Week Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "60px repeat(7, 1fr)" }}>
        <div></div>
        {days.map(day => (
          <div key={day} style={{ textAlign: "center", padding: 6, fontWeight: 600 }}>
            {format(day, "EEE d")}
            {isToday(day) && <div style={{ color: "#1a73e8", fontWeight: "bold" }}>Today</div>}
          </div>
        ))}

        {hours.map((hr) => (
          <React.Fragment key={hr}>
            <div style={{ textAlign: "right", paddingRight: 4, fontSize: 12 }}>
              {format(setHours(setMinutes(new Date(), 0), hr), "h aa")}
            </div>

            {days.map((day) => (
              <div
                key={day + "-" + hr}
                onClick={() => openCreateModal(day, hr)}
                style={{ border: "1px solid #eaeaea", height: 50, position: "relative", cursor: "pointer" }}
              >
                {getEventsForHour(day, hr).map(ev => {
                  const start = parseISO(ev.start);
                  const end = parseISO(ev.end);
                  const startHour = start.getHours() + start.getMinutes() / 60;
                  const duration = (end - start) / (1000 * 60 * 60);
                  const topOffset = (startHour - hr) * 50;

                  return (
                    <div
                      key={ev._id || ev.id}
                      onClick={(e) => { e.stopPropagation(); openEditModal(ev); }}
                      onMouseEnter={(e) => setHoveredEvent({ ev, x: e.clientX, y: e.clientY })}
                      onMouseLeave={() => setHoveredEvent(null)}
                      style={{
                        background: ev.color,
                        color: "#fff",
                        padding: "3px 6px",
                        fontSize: 11,
                        borderRadius: 4,
                        position: "absolute",
                        width: "92%",
                        left: "50%",
                        transform: "translateX(-50%)",
                        top: `${topOffset}px`,
                        height: `${duration * 50}px`,
                        overflow: "hidden",
                        cursor: "pointer",
                      }}
                    >
                      {ev.title}
                    </div>
                  );
                })}
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>

      {/* Hover Tooltip */}
      {hoveredEvent && (
        <div
          style={{
            position: "fixed",
            top: hoveredEvent.y + 12,
            left: hoveredEvent.x + 12,
            background: "#fff",
            color: "#333",
            padding: "10px 14px",
            borderRadius: 8,
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            fontSize: 13,
            zIndex: 10000,
            pointerEvents: "none",
            maxWidth: 240,
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{hoveredEvent.ev.title}</div>
          <div style={{ fontSize: 12, color: "#555" }}>{hoveredEvent.ev.description || "No description"}</div>
          <div style={{ marginTop: 4, fontSize: 12, color: "#666" }}>
            {format(parseISO(hoveredEvent.ev.start), "MMM d, h:mm a")} -{" "}
            {format(parseISO(hoveredEvent.ev.end), "h:mm a")}
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={backdrop} onMouseDown={(e) => e.target === e.currentTarget && closeModal()}>
          <div style={modalBox}>
            <h3 style={{ margin: 0 }}>
              {editingEvent ? "Edit Event" : "Create Event"}
            </h3>

            <label style={{ fontSize: 13 }}>Title</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={input} />

            <label style={{ fontSize: 13 }}>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              style={{ ...input, height: 70 }}
            />

            <div style={{ display: "flex", gap: 40 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 13 }}>Start</label>
                <DateTimePicker value={form.start} onChange={(d) => setForm({ ...form, start: d })} />
              </div>

              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 13 }}>End</label>
                <DateTimePicker value={form.end} onChange={(d) => setForm({ ...form, end: d })} />
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <label style={{ fontSize: 13 }}>Color</label>
              <input
                type="color"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                style={{ width: 48, height: 34, padding: 2, border: "none" }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
              {editingEvent && <button onClick={removeEvent} style={danger}>Delete</button>}
              <button onClick={closeModal} style={ghost}>Cancel</button>
              <button onClick={saveEvent} style={primary}>{editingEvent ? "Save" : "Create"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ✅ Styles
const btn = { padding: "6px 14px", border: "1px solid #ddd", borderRadius: 8, background: "#fff", cursor: "pointer" };
const btnSmall = { width: 36, padding: 6, border: "1px solid #ddd", borderRadius: 8, background: "#fff", cursor: "pointer" };
const input = { width: "100%", padding: "8px 10px", borderRadius: 8, marginBottom: 6, border: "1px solid #e6e6e6" };
const primary = { padding: "8px 12px", background: "#1a73e8", color: "#fff", border: "none", borderRadius: 8 };
const ghost = { padding: "8px 12px", border: "1px solid #ccc", borderRadius: 8, background: "#fff" };
const danger = { padding: "8px 12px", background: "#e53935", color: "#fff", border: "none", borderRadius: 8 };
const backdrop = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 };
const modalBox = { background: "white", width: "600px", maxWidth: "90vw", borderRadius: 10, padding: 24, boxShadow: "0 10px 30px rgba(0,0,0,0.12)" };
