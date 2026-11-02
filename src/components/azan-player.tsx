"use client";

import { useState } from "react";
import { Volume2 } from "lucide-react";

export default function AzanPlayer() {
  const [error, setError] = useState("");

  return (
    <section className="azan-player-widget" aria-labelledby="azan-title">
      <div className="azan-header" id="azan-title">
        <Volume2 size={18} />
        <span>Azan</span>
      </div>
      <audio
        controls
        preload="metadata"
        aria-label="Azan audio player"
        src="/data/azaan.mp3"
        onCanPlay={() => setError("")}
        onError={() => setError("Could not load Azan audio. Check your connection and reload the page.")}
      />
      {error && <p className="azan-error" role="alert">{error}</p>}
    </section>
  );
}
