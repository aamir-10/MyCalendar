import React, { useState } from "react";
import {
  format, addMonths, subMonths, startOfMonth,
  endOfMonth, startOfWeek, endOfWeek, addDays,
  isSameMonth, isSameDay
} from "date-fns";

export default function Sidebar({ selectedDate, setSelectedDate, collapsed }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const renderCalendarCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    let days = [];
    let day = startDate;

    while (day <= endDate) {
      days.push(
        <div
          key={day}
          onClick={() => setSelectedDate(day)}
          style={{
            width: "32px",
            height: "32px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            borderRadius: "50%",
            cursor: "pointer",
            margin: "2px",
            background: isSameDay(day, selectedDate) ? "#1a73e8" : "transparent",
            color: isSameDay(day, selectedDate)
              ? "white"
              : isSameMonth(day, monthStart) ? "#000" : "#bbb",
            fontSize: collapsed ? "10px" : "14px"
          }}
        >
          {format(day, "d")}
        </div>
      );
      day = addDays(day, 1);
    }
    return days;
  };

  return (
    <div
      style={{
        ...styles.sidebar,
        width: collapsed ? "70px" : "260px",
        transition: "width 0.3s ease"
      }}
    >
      {!collapsed && (
        <div style={{ marginTop: 10 }}>
          <div style={styles.monthHeader}>
            <button onClick={prevMonth}>◀</button>
            <span style={{ fontWeight: 600 }}>{format(currentMonth, "MMMM yyyy")}</span>
            <button onClick={nextMonth}>▶</button>
          </div>

          <div style={styles.weekDays}>
            {"SUN MON TUE WED THU FRI SAT".split(" ").map((d) => (
              <div key={d} style={{ width: 32, textAlign: "center", fontSize: 12 }}>
                {d}
              </div>
            ))}
          </div>

          <div style={styles.calendarGrid}>{renderCalendarCells()}</div>
        </div>
      )}

      {collapsed && (
        <div style={{ marginTop: "20px", textAlign: "center", fontSize: "12px", color: "#666" }}>
          {format(currentMonth, "MMM yyyy")}
        </div>
      )}
    </div>
  );
}

const styles = {
  sidebar: {
    paddingTop: "18px",
    paddingRight: "1px",
    paddingLeft:"20px",
    borderRight: "1px solid #eee",
    height: "100vh",
    position: "fixed",
    left: 0,
    top: "60px", // ✅ keeps sidebar BELOW header
    overflowY: "auto",
    background: "#fff",
    zIndex: 9
  },
  monthHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginRight: 30,
    marginBottom: 10
    
  },
  weekDays: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 32px)",
    marginBottom: 6,
  },
  calendarGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 32px)",
  },
};
