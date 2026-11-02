"use client";

import type { Verse } from "@/lib/models";

export interface Word {
  text: string; // Arabic text
  transliteration: string;
  translation: string;
  indopak: string; // Indopak script representation
}

// Helper function to break down verse into words
export function parseVerse(verse: Verse): Word[] {
  // Split Arabic text into words
  const arabicWords = verse.arabic.split(/\s+/);
  const transliterationWords = verse.transliteration.split(/\s+/);
  
  return arabicWords.map((arabicWord, index) => ({
    text: arabicWord,
    transliteration: transliterationWords[index] || "",
    translation: verse.translations.sahih_international || "",
    indopak: arabicWord, // In production, convert to Indopak script
  }));
}

export function WordByWordDisplay({ verse }: { verse: Verse }) {
  const words = parseVerse(verse);
  
  return (
    <div className="word-by-word">
      <div className="words-container" dir="rtl" lang="ar">
        {words.map((word, index) => (
          <div key={index} className="word-card">
            <p className="word-text">{word.text}</p>
            <p className="word-transliteration">{word.transliteration}</p>
            <p className="word-indopak">{word.indopak}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
