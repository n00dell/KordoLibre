import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { ThemeProvider } from "./context/ThemeProvider";
import "./App.css";

// ThemeProvider wraps everything so any component, anywhere in the tree,
// can call useTheme() to read or change the active theme. Order relative
// to BrowserRouter doesn't matter here since they don't depend on each other.
ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <ThemeProvider>
            <BrowserRouter>
                <App />
            </BrowserRouter>
        </ThemeProvider>
    </React.StrictMode>
);