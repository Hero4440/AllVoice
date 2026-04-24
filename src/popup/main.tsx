import React from 'react';
import ReactDOM from 'react-dom/client';
import '../styles/globals.css';

function App(): React.ReactElement {
  return (
    <div
      className="min-w-[360px] min-h-[480px] bg-hc-bg text-hc-text p-4"
      role="application"
      aria-label="AllVoice Browser Copilot"
    >
      <h1 className="text-heading text-hc-accent">AllVoice</h1>
      <p className="text-body text-hc-text-secondary mt-2">
        Inclusive browser copilot — voice commands coming soon.
      </p>
    </div>
  );
}

const root = document.getElementById('root');
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
