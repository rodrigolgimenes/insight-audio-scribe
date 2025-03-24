
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { setupMicrophoneNotificationSuppression } from "./lib/suppressMicrophoneNotifications";

// Configure a supressão de notificações antes de qualquer coisa
setupMicrophoneNotificationSuppression();

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
