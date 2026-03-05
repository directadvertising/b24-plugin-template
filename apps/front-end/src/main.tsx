import { B24Provider } from "@common/b24ui-react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";
import IndexPage from "./pages/index.tsx";
import InstallPage from "./pages/install.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <B24Provider apiBaseUrl="" isDev={import.meta.env.DEV}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<IndexPage />} />
          <Route path="/install" element={<InstallPage />} />
        </Routes>
      </BrowserRouter>
    </B24Provider>
  </StrictMode>,
);
