import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const EventContext = createContext();

export const EventProvider = ({ children }) => {
  const [events, setEvents] = useState([]);

  const API = "https://mycalendar-backend.onrender.com/api/events"; // ✅ backend base

  // ✅ Load Events from Backend on Startup
  useEffect(() => {
    axios.get(API)
      .then(res => setEvents(res.data))
      .catch(err => console.error("Error loading events", err));
  }, []);

  // ✅ Add Event (POST)
  const addEvent = async (eventData) => {
    try {
      const res = await axios.post(API, eventData);
      setEvents(prev => [...prev, res.data]); // add new event to UI
    } catch (err) {
      console.error("Add event failed", err);
    }
  };

  // ✅ Update Event (PUT)
  const updateEvent = async (id, updatedEvent) => {
    try {
      const res = await axios.put(`${API}/${id}`, updatedEvent);
      setEvents(prev =>
        prev.map(ev => (ev._id === id ? res.data : ev))
      );
    } catch (err) {
      console.error("Update event failed", err);
    }
  };

  // ✅ Delete Event (DELETE)
  const deleteEvent = async (id) => {
    try {
      await axios.delete(`${API}/${id}`);
      setEvents(prev => prev.filter(ev => ev._id !== id));
    } catch (err) {
      console.error("Delete event failed", err);
    }
  };

  return (
    <EventContext.Provider value={{ events, addEvent, updateEvent, deleteEvent }}>
      {children}
    </EventContext.Provider>
  );
};

export const useEvents = () => useContext(EventContext);
