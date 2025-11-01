import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { EventProvider } from "./context/EventContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <EventProvider>
    <App />
  </EventProvider>
);
