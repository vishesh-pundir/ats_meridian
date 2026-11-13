import React from "react";
import { createRoot } from "react-dom/client";
import MeridianApp from "./App.jsx";
import "./styles.css";
import "./multi-role.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <MeridianApp />
  </React.StrictMode>
);
