import React, { useState } from "react";

export function ClauseTranslation() {
  const [input, setInput] = useState("");
  const [targetLang, setTargetLang] = useState("hi");
  const [translation, setTranslation] = useState("");
  const [loading, setLoading] = useState(false);

  const handleTranslate = async () => {
    setLoading(true);
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/translate-text`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input, targetLang }),
      }
    );
    const data = await res.json();
    setTranslation(data.translation);
    setLoading(false);
  };

  return (
    <div>
      <textarea
        placeholder="Enter clause to translate"
        value={input}
        onChange={e => setInput(e.target.value)}
        rows={4}
        cols={50}
      />
      <select value={targetLang} onChange={e => setTargetLang(e.target.value)}>
        <option value="hi">Hindi</option>
        <option value="ta">Tamil</option>
        <option value="te">Telugu</option>
        {/* Add more languages as needed */}
      </select>
      <button onClick={handleTranslate} disabled={loading}>
        {loading ? "Translating..." : "Translate"}
      </button>
      {translation && (
        <div>
          <strong>Translation:</strong>
          <div>{translation}</div>
        </div>
      )}
    </div>
  );
}