import React from "react";
import ReactDOM from "react-dom/client";
import "../styles/global.css";

export function mountComponent(Component) {
  ReactDOM.createRoot(document.getElementById("app")).render(
    <React.StrictMode>
      <Component />
    </React.StrictMode>
  );
}
