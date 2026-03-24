import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

try {
  const root = document.getElementById('root');
  if (!root) throw new Error("Root element not found");
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
} catch (e) {
  console.error("VectorSense Dashboard Boot Error:", e);
  document.body.innerHTML = `<div style="color:red; padding: 50px; font-family: sans-serif;">
    <h1>BOOT ERROR</h1>
    <pre>${e.stack}</pre>
  </div>`;
}
