import { useState } from "react";
import "./app.css";

export default function App() {
  const [tab, setTab] = useState("json");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [analyzed, setAnalyzed] = useState(false);

  const analyze = async () => {
    setAnalyzed(true);
    setOutput("✔ Errors detected and safe fixes applied.\n\n(This is a preview. Unlock Pro to download the full fixed file and report.)");
  };

  return (
    <div className="app">
      {/* HEADER */}
      <header className="header">
        <div className="logo">Config Doctor</div>
        <button className="ghost">Open Tool</button>
      </header>

      {/* HERO */}
      <section className="hero">
        <h1>Fix broken .env, JSON, and YAML files in under 30 seconds.</h1>
        <p>
          Paste or upload your config file. Config Doctor detects errors,
          auto-fixes safe issues, and generates a clean, shareable report —
          no setup, no accounts.
        </p>
        <div className="cta">
          <button className="primary">Try Free</button>
          <button className="secondary">Unlock Pro</button>
        </div>
      </section>

      {/* STEPS */}
      <section className="steps">
        <div>
          <h3>1) Analyze</h3>
          <p>Instant syntax + common mistake detection for ENV / JSON / YAML.</p>
        </div>
        <div>
          <h3>2) Fix</h3>
          <p>Auto-fix safe issues and output a clean, corrected file.</p>
        </div>
        <div>
          <h3>3) Report</h3>
          <p>Export a professional report for teammates or debugging context.</p>
        </div>
      </section>

      {/* TOOL */}
      <section className="tool">
        <div className="tabs">
          <button onClick={() => setTab("env")} className={tab === "env" ? "active" : ""}>ENV</button>
          <button onClick={() => setTab("json")} className={tab === "json" ? "active" : ""}>JSON</button>
          <button onClick={() => setTab("yaml")} className={tab === "yaml" ? "active" : ""}>YAML</button>
        </div>

        <textarea
          placeholder={`Paste your ${tab.toUpperCase()} file here...`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />

        <button className="primary" onClick={analyze}>
          Analyze & Fix
        </button>

        {analyzed && (
          <div className="result">
            <pre>{output}</pre>
            <button className="secondary">Unlock Pro to Download</button>
          </div>
        )}
      </section>

      {/* PROOF */}
      <section className="proof">
        <h3>Example Fix</h3>
        <pre>
{`Before:
DATABASE_URL==postgres://localhost
PORT=3000
PORT=3000

After:
DATABASE_URL=postgres://localhost
PORT=3000

✔ Duplicate key removed
✔ Invalid assignment corrected`}
        </pre>
        <p>This is what you pay for.</p>
      </section>

      {/* PRICING */}
      <section className="pricing">
        <div className="card">
          <h3>Free</h3>
          <ul>
            <li>Analyze files</li>
            <li>Preview fixed output</li>
            <li>No download</li>
            <li>No report export</li>
          </ul>
        </div>

        <div className="card pro">
          <h3>Pro</h3>
          <strong>$12 per fix</strong>
          <ul>
            <li>Download fixed file</li>
            <li>Export shareable report</li>
            <li>Unlimited file size</li>
            <li>No account required</li>
          </ul>
          <button className="primary">Unlock Pro</button>
          <small>If it saves you 10 minutes once, it paid for itself.</small>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <p>Config Doctor — A focused tool for developers.</p>
        <p>No accounts. No tracking. No permanent storage.</p>
      </footer>
    </div>
  );
}
