import React, { useEffect, useRef, useState } from "react";
import {
  addMonths, subMonths, format, startOfMonth, endOfMonth, startOfWeek,
  endOfWeek, addDays, isSameMonth, isSameDay, parseISO, isBefore,
  isAfter, startOfDay, endOfDay
} from "date-fns";
import { useEvents } from "../context/EventContext"; // ✅ global event state (instead of local)
 
function formatDateTime(iso) {
  try { return format(parseISO(iso), "dd MMM yyyy, hh:mm a"); } 
  catch { return iso; }
}

export default function Month() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [form, setForm] = useState({
    title: "", description: "",
    start: "", end: "",
    color: "#1976d2"
  });

  const [dayListOpen, setDayListOpen] = useState(null);
  const [hoverTooltip, setHoverTooltip] = useState({ visible: false, x: 0, y: 0, event: null });
  const dragRef = useRef({ dragging: false, startDate: null, endDate: null });
  const [dragPreviewRange, setDragPreviewRange] = useState(null);

  // ✅ use global context instead of local state
  const { events, addEvent, updateEvent, deleteEvent } = useEvents();

  const genId = () => `${Date.now()}-${Math.floor(Math.random() * 10000)}`;

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToday = () => setCurrentMonth(new Date());

  const openCreateModal = ({ startISO, endISO }) => {
    setEditingEvent(null);
    setForm({
      title: "", description: "",
      start: toDateTimeLocal(startISO || new Date()),
      end: toDateTimeLocal(endISO || addDays(new Date(), 1)),
      color: "#1976d2"
    });
    setShowModal(true);
  };

  function toDateTimeLocal(d) {
    const date = typeof d === "string" ? parseISO(d) : d;
    const pad = n => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  const saveFromForm = async () => {
    if (!form.title.trim()) return alert("Enter a title");

    const payload = {
      title: form.title,
      description: form.description,
      start: new Date(form.start).toISOString(),
      end: new Date(form.end).toISOString(),
      color: form.color
    };

    if (editingEvent) await updateEvent(editingEvent._id, payload);
    else await addEvent(payload);

    setShowModal(false);
    setEditingEvent(null);
  };

  const openEditModal = (ev) => {
    setEditingEvent(ev);
    setForm({
      title: ev.title,
      description: ev.description,
      start: toDateTimeLocal(ev.start),
      end: toDateTimeLocal(ev.end),
      color: ev.color
    });
    setShowModal(true);
  };

  const handleDayClick = (day) => {
    const start = new Date(startOfDay(day)); start.setHours(9);
    const end = new Date(start); end.setHours(10);
    openCreateModal({ startISO: start.toISOString(), endISO: end.toISOString() });
  };

  const eventsForDay = (day) => {
    return events.filter(ev => {
      const evStart = parseISO(ev.start);
      const evEnd = parseISO(ev.end);
      return !(isBefore(evEnd, startOfDay(day)) || isAfter(evStart, endOfDay(day)));
    }).sort((a,b) => new Date(a.start)-new Date(b.start));
  };

  const onCellMouseDown = (day) => {
    dragRef.current.dragging = true;
    dragRef.current.startDate = startOfDay(day);
    dragRef.current.endDate = startOfDay(day);
    setDragPreviewRange({ start: dragRef.current.startDate, end: dragRef.current.endDate });
  };

  const onCellMouseEnter = (day) => {
    if (!dragRef.current.dragging) return;
    dragRef.current.endDate = startOfDay(day);
    const s = dragRef.current.startDate <= dragRef.current.endDate ? dragRef.current.startDate : dragRef.current.endDate;
    const e = dragRef.current.startDate <= dragRef.current.endDate ? dragRef.current.endDate : dragRef.current.startDate;
    const start = new Date(s); start.setHours(9);
    const end = new Date(e); end.setHours(17);
    setDragPreviewRange({ start, end });
  };

  const onMouseUp = () => {
    if (!dragRef.current.dragging) return;
    dragRef.current.dragging = false;
    const p = dragPreviewRange;
    if (p) openCreateModal({ startISO: p.start.toISOString(), endISO: p.end.toISOString() });
    setDragPreviewRange(null);
  };

  useEffect(() => {
    document.addEventListener("mouseup", onMouseUp);
    return () => document.removeEventListener("mouseup", onMouseUp);
  }, [dragPreviewRange]);

  const rows = [];
  let day = startDate;
  let weekIndex = 0;

  while (day <= endDate) {
    const cells = [];
    for (let i = 0; i < 7; i++) {
      const thisDay = day;
      const isoKey = format(thisDay, "yyyy-MM-dd");
      const dayEvents = eventsForDay(thisDay);
      const isToday = isSameDay(thisDay, new Date());
      const inMonth = isSameMonth(thisDay, monthStart);

      let inPreview = false;
      if (dragPreviewRange) {
        const s = startOfDay(dragPreviewRange.start);
        const e = startOfDay(dragPreviewRange.end);
        inPreview = !(isBefore(thisDay, s) || isAfter(thisDay, e));
      }

      cells.push(
        <div
          key={`${weekIndex}-${i}`}
          onMouseDown={() => onCellMouseDown(thisDay)}
          onMouseEnter={() => onCellMouseEnter(thisDay)}
          onClick={(e) => { if (!dragRef.current.dragging) handleDayClick(thisDay); }}
          style={{
            border: "1px solid #e6e6e6",
            padding: 8,
            minHeight: 96,
            background: inMonth ? (inPreview ? "#e8f0ff" : "white") : "#fafafa",
            position: "relative",
            cursor: "pointer",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column"
          }}
        >
          {/* day header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 6 }}>
            <div style={{
              fontSize: 13,
              fontWeight: isToday ? 700 : 500,
              color: isToday ? "white" : "#111",
              background: isToday ? "#1a73e8" : "transparent",
              padding: isToday ? "2px 8px" : "0",
              borderRadius: isToday ? 999 : 0,
            }}>
              {format(thisDay, "d")}
            </div>

            <button
              onClick={(evt) => { evt.stopPropagation(); handleDayClick(thisDay); }}
              title="Create event"
              style={{
                fontSize: 12,
                padding: "4px 6px",
                borderRadius: 6,
                border: "none",
                background: "#f1f3f4",
                cursor: "pointer"
              }}
            >
            </button>
          </div>

          {/* events list */}
          <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 4 }}>
            {dayEvents.slice(0, 2).map((ev) => {
              const evStart = parseISO(ev.start);
              const evEnd = parseISO(ev.end);
              const spansLeft = isBefore(evStart, startOfDay(thisDay));
              const spansRight = isAfter(evEnd, endOfDay(thisDay));

              return (
                <div
                  key={ev._id}
                  onClick={(e) => { e.stopPropagation(); openEditModal(ev); }}
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setHoverTooltip({ visible: true, x: rect.right + 8, y: rect.top, event: ev });
                  }}
                  onMouseLeave={() => setHoverTooltip({ visible: false, x: 0, y: 0, event: null })}
                  style={{
                    background: ev.color || "#1976d2",
                    color: "white",
                    padding: "4px 6px",
                    borderRadius: 6,
                    fontSize: 12,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 6,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    borderTopLeftRadius: spansLeft ? 0 : 6,
                    borderBottomLeftRadius: spansLeft ? 0 : 6,
                    borderTopRightRadius: spansRight ? 0 : 6,
                    borderBottomRightRadius: spansRight ? 0 : 6,
                  }}
                >
                  <div style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>
                    {ev.title}
                  </div>
                </div>
              );
            })}
            {dayEvents.length > 2 && (
              <div
                onClick={(e) => { e.stopPropagation(); setDayListOpen(isoKey); }}
                style={{
                  fontSize: 12,
                  color: "#555",
                  cursor: "pointer",
                  marginTop: 4
                }}
              >
                +{dayEvents.length - 2} more
              </div>
            )}
          </div>
        </div>
      );
      day = addDays(day, 1);
    }
    rows.push(<div key={weekIndex} style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0 }}>{cells}</div>);
    weekIndex++;
  }

  const handleDelete = async (id) => {
    await deleteEvent(id);
    setShowModal(false);
    setEditingEvent(null);
  };

  const deleteIfEditing = () => {
    if (!editingEvent) return;
    handleDelete(editingEvent._id);
  };

  const dayListContent = (isoKey) => {
    const day = parseISO(isoKey + "T00:00:00");
    const list = eventsForDay(day);
    return (
      <div style={{ background: "white", padding: 12, borderRadius: 8, minWidth: 320 }}>
        <h4 style={{ margin: "0 0 8px 0" }}>{format(day, "dd MMM yyyy")}</h4>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {list.map((ev) => (
            <div key={ev._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div style={{ width: 10, height: 10, background: ev.color || "#1976d2", borderRadius: 3 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{ev.title}</div>
                  <div style={{ fontSize: 12, color: "#666" }}>{formatDateTime(ev.start)} — {formatDateTime(ev.end)}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => { openEditModal(ev); setDayListOpen(null); }} style={{ padding: "6px 8px" }}>Edit</button>
                <button onClick={() => { handleDelete(ev._id); setDayListOpen(null); }} style={{ padding: "6px 8px" }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: 20, userSelect: "none" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={goToday} style={buttonStyle}>Today</button>
          <button onClick={prevMonth} style={iconButtonStyle}>◀</button>
          <button onClick={nextMonth} style={iconButtonStyle}>▶</button>
        </div>

        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{format(currentMonth, "MMMM yyyy")}</h2>

        <div style={{ marginLeft: "auto", color: "#666" }}>
          <small>Tip: drag across days to create multi-day event</small>
        </div>
      </div>

      {/* Weekday labels */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", fontWeight: 700, color: "#333", marginBottom: 6 }}>
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} style={{ textAlign: "center", padding: "6px 8px" }}>{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div onMouseLeave={() => { if (dragRef.current.dragging) { dragRef.current.dragging = false; setDragPreviewRange(null); } }}>
        {rows}
      </div>

      {/* Tooltip for hover */}
      {hoverTooltip.visible && hoverTooltip.event && (
        <div style={{
          position: "fixed",
          left: hoverTooltip.x,
          top: hoverTooltip.y,
          background: "white",
          border: "1px solid rgba(0,0,0,0.08)",
          boxShadow: "0 6px 12px rgba(0,0,0,0.08)",
          padding: 10,
          borderRadius: 8,
          zIndex: 9999,
          minWidth: 220
        }}>
          <div style={{ fontWeight: 700 }}>{hoverTooltip.event.title}</div>
          <div style={{ fontSize: 12, color: "#555", marginTop: 6 }}>{formatDateTime(hoverTooltip.event.start)}</div>
          <div style={{ fontSize: 12, color: "#555" }}>{formatDateTime(hoverTooltip.event.end)}</div>
          {hoverTooltip.event.description && <div style={{ marginTop: 8, color: "#444" }}>{hoverTooltip.event.description}</div>}
        </div>
      )}

      {/* Day list popup */}
      {dayListOpen && (
        <div style={{
          position: "fixed",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 9999
        }}>
          <div style={{ position: "relative" }}>
            {dayListContent(dayListOpen)}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
              <button onClick={() => setDayListOpen(null)} style={{ padding: "8px 10px" }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
     {showModal && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.35)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 9999,
    }}
    onMouseDown={(e) => {
      if (e.target === e.currentTarget) {
        setShowModal(false);
        setEditingEvent(null);
      }
    }}
  >
    <div
      style={{
        background: "white",
        width: "600px", // ⬅️ Increased from 420px to 600px
        maxWidth: "90vw", // ⬅️ Makes it responsive on smaller screens
        maxHeight: "90vh", // ⬅️ Keeps it within screen bounds
        overflowY: "auto", // ⬅️ Scroll if content overflows vertically
        borderRadius: 10,
        padding: 24, // ⬅️ Slightly more padding for balance
        boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h3 style={{ margin: 0 }}>
          {editingEvent ? "Edit Event" : "Create Event"}
        </h3>
        <div style={{ display: "flex", gap: 10 }}>
          {editingEvent && (
            <button onClick={deleteIfEditing} style={dangerButtonStyle}>
              Delete
            </button>
          )}
          <button
            onClick={() => {
              setShowModal(false);
              setEditingEvent(null);
            }}
            style={ghostButtonStyle}
          >
            Close
          </button>
        </div>
      </div>

      <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
        <label style={{ fontSize: 13 }}>Title</label>
        <input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          style={inputStyle}
        />

        <label style={{ fontSize: 13 }}>Description</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          style={{ ...inputStyle, height: 80 }}
        />

        <div style={{ display: "flex", gap: 40 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 13 }}>Start</label>
            <input
              type="datetime-local"
              value={form.start}
              onChange={(e) => setForm({ ...form, start: e.target.value })}
              style={inputStyle}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 13 }}>End</label>
            <input
              type="datetime-local"
              value={form.end}
              onChange={(e) => setForm({ ...form, end: e.target.value })}
              style={inputStyle}
            />
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

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            marginTop: 6,
          }}
        >
          <button
            onClick={() => {
              setShowModal(false);
              setEditingEvent(null);
            }}
            style={ghostButtonStyle}
          >
            Cancel
          </button>
          <button onClick={saveFromForm} style={primaryButtonStyle}>
            {editingEvent ? "Save" : "Create"}
          </button>
        </div>
      </div>
    </div>
  </div>
)}

    </div>
  );
}

/* styles */
const buttonStyle = {
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px solid rgba(0,0,0,0.08)",
  background: "white",
  cursor: "pointer",
};

const iconButtonStyle = {
  ...buttonStyle,
  padding: "8px 10px",
  fontWeight: 700,
};

const inputStyle = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: 8,
  border: "1px solid #e6e6e9",
  fontSize: 14,
};

const primaryButtonStyle = {
  padding: "8px 12px",
  background: "#1a73e8",
  color: "white",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
};

const ghostButtonStyle = {
  padding: "8px 12px",
  background: "transparent",
  color: "#333",
  border: "1px solid #e6e6e9",
  borderRadius: 8,
  cursor: "pointer",
};

const dangerButtonStyle = {
  padding: "8px 12px",
  background: "#e53935",
  color: "white",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
};
