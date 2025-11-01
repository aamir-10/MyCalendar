import React, { useState, useEffect } from "react";
import {
  format,
  startOfDay,
  addHours,
  setHours,
  setMinutes,
  isToday,
  parseISO,
} from "date-fns";
import { useEvents } from "../context/EventContext";
import DateTimePicker from "react-datetime-picker";
import "react-datetime-picker/dist/DateTimePicker.css";
import "react-calendar/dist/Calendar.css";
import "react-clock/dist/Clock.css";

export default function Day() {
  const [currentDay, setCurrentDay] = useState(new Date());
  const { events, addEvent, updateEvent, deleteEvent } = useEvents();

  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    start: "",
    end: "",
    color: "#1976d2",
  });

  const [hoveredEvent, setHoveredEvent] = useState(null);

  const hours = [...Array(24)].map((_, i) => i);

  function openModal(day, hour) {
    const start = setMinutes(setHours(day, hour), 0);
    const end = setMinutes(setHours(day, hour + 1), 0);

    setEditingEvent(null);
    setForm({
      title: "",
      description: "",
      start,
      end,
      color: "#1976d2",
    });
    setShowModal(true);
  }

  function openEdit(ev) {
    setEditingEvent(ev);
    setForm({
      title: ev.title,
      description: ev.description || "",
      start: new Date(ev.start),
      end: new Date(ev.end),
      color: ev.color || "#1976d2",
    });
    setShowModal(true);
  }

  function saveEvent() {
    const payload = {
      title: form.title,
      description: form.description,
      start: new Date(form.start).toISOString(),
      end: new Date(form.end).toISOString(),
      color: form.color,
    };

    editingEvent
      ? updateEvent(editingEvent._id, { ...editingEvent, ...payload })
      : addEvent(payload);

    setShowModal(false);
  }

  function deleteEvt() {
    if (editingEvent) deleteEvent(editingEvent._id);
    setShowModal(false);
  }

  const getEventsForDay = () => {
    return events.filter((ev) => {
      const d = new Date(ev.start);
      return (
        d.getFullYear() === currentDay.getFullYear() &&
        d.getMonth() === currentDay.getMonth() &&
        d.getDate() === currentDay.getDate()
      );
    });
  };

  const dayEvents = getEventsForDay();

  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ padding: 10 }}>
      {/* Navigation */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "12px",
        }}
      >
        <button onClick={() => setCurrentDay(new Date())} style={navBtn}>
          Today
        </button>
        <button
          onClick={() => setCurrentDay(addHours(currentDay, -24))}
          style={navBtn}
        >
          ◀
        </button>
        <button
          onClick={() => setCurrentDay(addHours(currentDay, 24))}
          style={navBtn}
        >
          ▶
        </button>

        <h2 style={{ marginLeft: 10, fontSize: "18px", fontWeight: 900 }}>
          {format(currentDay, "EEEE, MMM d yyyy")}
        </h2>
      </div>

      {/* Day Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "60px 1fr" }}>
        {/* Time labels */}
        <div>
          {hours.map((hr) => (
            <div
              key={hr}
              style={{
                height: 60,
                textAlign: "right",
                paddingRight: 6,
                fontSize: 11,
              }}
            >
              {format(setHours(setMinutes(new Date(), 0), hr), "h aa")}
            </div>
          ))}
        </div>

        {/* Timeline */}
        <div style={{ position: "relative", borderLeft: "1px solid #ececec" }}>
          {hours.map((hr) => (
            <div
              key={hr}
              onClick={() => openModal(startOfDay(currentDay), hr)}
              style={{
                height: 60,
                borderBottom: "1px solid #f2f2f2",
                cursor: "pointer",
                position: "relative",
              }}
            />
          ))}

          {/* Events */}
          {dayEvents.map((ev) => {
            const start = parseISO(ev.start);
            const end = parseISO(ev.end);
            const startHour = start.getHours() + start.getMinutes() / 60;
            const duration = (end - start) / (1000 * 60 * 60);
            const topOffset = startHour * 60;
            const height = duration * 60;

            return (
              <div
                key={ev._id}
                onClick={(e) => {
                  e.stopPropagation();
                  openEdit({ ...ev, id: ev._id });
                }}
                onMouseEnter={(e) =>
                  setHoveredEvent({
                    ev,
                    x: e.clientX,
                    y: e.clientY,
                  })
                }
                onMouseLeave={() => setHoveredEvent(null)}
                style={{
                  position: "absolute",
                  left: "5%",
                  width: "90%",
                  top: `${topOffset}px`,
                  height: `${height}px`,
                  background: ev.color,
                  color: "white",
                  padding: "3px 6px",
                  borderRadius: 6,
                  fontSize: 12,
                  overflow: "hidden",
                  cursor: "pointer",
                }}
              >
                {ev.title}
              </div>
            );
          })}

          {/* Red current time line */}
          {isToday(currentDay) && (
            <div
              style={{
                position: "absolute",
                top: `${(now.getHours() + now.getMinutes() / 60) * 60}px`,
                left: 0,
                right: 0,
                height: 2,
                background: "red",
                zIndex: 10,
              }}
            />
          )}
        </div>
      </div>

      {/* Tooltip on hover */}
      {hoveredEvent && (
        <div
          style={{
            position: "fixed",
            top: hoveredEvent.y + 10,
            left: hoveredEvent.x + 10,
            background: "white",
            color: "#333",
            borderRadius: 8,
            boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
            padding: "10px 12px",
            fontSize: 13,
            maxWidth: 220,
            zIndex: 9999,
          }}
        >
          <div style={{ fontWeight: "bold", marginBottom: 4 }}>
            {hoveredEvent.ev.title}
          </div>
          <div style={{ fontSize: 12 }}>
            {hoveredEvent.ev.description || "No description"}
          </div>
          <div style={{ marginTop: 6, fontSize: 11, color: "#555" }}>
            {format(parseISO(hoveredEvent.ev.start), "MMM d, h:mm a")} –{" "}
            {format(parseISO(hoveredEvent.ev.end), "h:mm a")}
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div
          style={backdrop}
          onMouseDown={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div style={modal}>
            <h3 style={{ margin: 0 }}>
              {editingEvent ? "Edit Event" : "Create Event"}
            </h3>

            <label style={{ fontSize: 13 }}>Title</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              style={inputStyle}
            />

            <label style={{ fontSize: 13 }}>Description</label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              style={{ ...inputStyle, height: 70 }}
            />

            <div style={{ display: "flex", gap: 40 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 13 }}>Start</label>
                <DateTimePicker
                  onChange={(date) => setForm({ ...form, start: date })}
                  value={form.start}
                  format="y-MM-dd h:mm a"
                  disableClock
                  clearIcon={null}
                  calendarIcon={null}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 13 }}>End</label>
                <DateTimePicker
                  onChange={(date) => setForm({ ...form, end: date })}
                  value={form.end}
                  format="y-MM-dd h:mm a"
                  disableClock
                  clearIcon={null}
                  calendarIcon={null}
                />
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <label style={{ fontSize: 13 }}>Color</label>
              <input
                type="color"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                style={{ width: 48, height: 34, border: "none" }}
              />
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
                marginTop: 8,
              }}
            >
              {editingEvent && (
                <button onClick={deleteEvt} style={dangerBtn}>
                  Delete
                </button>
              )}
              <button
                onClick={() => setShowModal(false)}
                style={ghostBtn}
              >
                Cancel
              </button>
              <button onClick={saveEvent} style={primaryBtn}>
                {editingEvent ? "Save" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ✅ Styles */
const navBtn = {
  padding: "6px 14px",
  border: "1px solid #ddd",
  borderRadius: 8,
  background: "#fff",
  cursor: "pointer",
  fontSize: 14,
};

const inputStyle = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: 8,
  border: "1px solid #e6e6e6",
};

const primaryBtn = {
  padding: "8px 12px",
  background: "#1a73e8",
  color: "#fff",
  border: "none",
  borderRadius: 8,
};

const ghostBtn = {
  padding: "8px 12px",
  border: "1px solid #ccc",
  borderRadius: 8,
  background: "#fff",
};

const dangerBtn = {
  padding: "8px 12px",
  background: "#e53935",
  color: "#fff",
  border: "none",
  borderRadius: 8,
};

const backdrop = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.35)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 9999,
};

const modal = {
  background: "white",
  width: 600,
  borderRadius: 10,
  padding: 24,
  boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
};
