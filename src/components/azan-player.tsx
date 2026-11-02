"use client";

import { useRef, useState } from "react";
import { Play, Pause, Volume2 } from "lucide-react";

export default function AzanPlayer() {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [error, setError] = useState("");

  async function togglePlayback() {
    if (!audio.current) return;
    try {
      if (playing) {
        audio.current.pause();
      } else {
        await audio.current.play();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not play Azan");
    }
  }

  return (
    <div className="azan-player-widget">
      <div className="azan-header">
        <Volume2 size={18} />
        <span>Azan</span>
      </div>
      <div className="azan-controls">
        <button
          className="azan-play-button"
          onClick={togglePlayback}
          aria-label={playing ? "Pause Azan" : "Play Azan"}
        >
          {playing ? <Pause size={20} /> : <Play size={20} />}
        </button>
        <div className="azan-volume-control">
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={(e) => {
              const newVolume = parseFloat(e.target.value);
              setVolume(newVolume);
              if (audio.current) audio.current.volume = newVolume;
            }}
            aria-label="Azan volume"
            className="volume-slider"
          />
        </div>
      </div>
      {error && <p className="azan-error" role="alert">{error}</p>}
      <audio
        ref={audio}
        src="/data/azaan.mp3"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onError={() => setError("Could not load Azan audio")}
      />
    </div>
  );
}
