"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Bold, Italic, Link as LinkIcon, X, Save, ExternalLink, Lock } from "lucide-react";
import { useLibrary } from "./library-provider";
import { parseMedia } from "@/lib/media";
import { AdminLoginDialog, type AdminCredentials } from "./admin-login";

export function NotePreview({ text }: { text: string }) {
  const [failed, setFailed] = useState<string[]>([]);
  return <div className="note-preview">
    <ReactMarkdown allowedElements={["p", "strong", "em", "a", "ul", "ol", "li", "blockquote", "br", "code", "h2", "h3"]}
      components={{ a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer">{children}</a> }}>{text}</ReactMarkdown>
    {parseMedia(text).map((media) => <div className="media-preview" key={media.url}>
      {media.kind === "youtube" && <iframe src={media.embed} title="YouTube note attachment" loading="lazy"
        sandbox="allow-scripts allow-same-origin allow-presentation" allow="encrypted-media; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />}
      {media.kind === "audio" && <audio controls preload="none" src={media.url} onError={() => setFailed((value) => [...value, media.url])} />}
      {media.kind === "video" && <video controls preload="none" src={media.url} onError={() => setFailed((value) => [...value, media.url])} />}
      {failed.includes(media.url) && <p role="alert">This recording could not be played. Try opening the source.</p>}
      <a href={media.url} target="_blank" rel="noopener noreferrer"><ExternalLink size={14} /> {media.kind === "link" ? media.url : "Open media source"}</a>
    </div>)}
  </div>;
}

export default function NoteEditor({ verseKey, onClose }: { verseKey: string; onClose: () => void }) {
  const { library, saveNote, ready, error } = useLibrary();
  const original = library.notes[verseKey]?.text || "";
  const [text, setText] = useState(original);
  const [discard, setDiscard] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCredentials, setAdminCredentials] = useState<AdminCredentials | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { 
    dialog.current?.showModal(); 
  }, []);

  useEffect(() => {
    // Check if admin is already logged in
    const stored = localStorage.getItem("waqt.admin");
    if (stored) {
      try {
        const creds = JSON.parse(stored);
        setAdminCredentials(creds);
        setIsAdmin(true);
      } catch {
        // Invalid stored credentials
      }
    }
  }, []);

  function close() {
    if (text !== original) setDiscard(true);
    else onClose();
  }

  function format(before: string, after = before) {
    const start = input.current?.selectionStart ?? text.length;
    const end = input.current?.selectionEnd ?? text.length;
    setText(text.slice(0, start) + before + text.slice(start, end) + after + text.slice(end));
    input.current?.focus();
  }

  function handleAdminLogin(credentials: AdminCredentials) {
    setAdminCredentials(credentials);
    setIsAdmin(true);
    setShowLoginDialog(false);
    // Store admin credentials locally (encrypted would be better in production)
    localStorage.setItem("waqt.admin", JSON.stringify(credentials));
  }

  function handleAdminLogout() {
    setAdminCredentials(null);
    setIsAdmin(false);
    localStorage.removeItem("waqt.admin");
  }

  return <>
    <dialog ref={dialog} className="note-dialog" onCancel={(event) => { event.preventDefault(); close(); }} aria-labelledby="note-title">
      <div className="dialog-heading">
        <div>
          <span className="eyebrow">PERSONAL REFLECTION</span>
          <h2 id="note-title">A note on ayah {verseKey}</h2>
        </div>
        <div className="dialog-header-actions">
          {isAdmin && <span className="admin-badge"><Lock size={14} /> Admin</span>}
          <button className="icon-button" aria-label="Close note" onClick={close}><X size={20} /></button>
        </div>
      </div>
      <p className="muted">A thought, a lesson, a moment to return to. {isAdmin ? "Saved to GitHub." : "Only saved on this device."}</p>
      <div className="editor-toolbar">
        <button aria-label="Bold text" onClick={() => format("**")}><Bold size={17} /></button>
        <button aria-label="Italic text" onClick={() => format("*")}><Italic size={17} /></button>
        <button aria-label="Insert link" onClick={() => format("[", "](https://)")}><LinkIcon size={17} /></button>
        <span>Markdown supported • Text typing enabled</span>
        <div className="toolbar-spacer" />
        {!isAdmin ? (
          <button className="text-button small" onClick={() => setShowLoginDialog(true)}>
            <Lock size={14} /> Admin Login
          </button>
        ) : (
          <button className="text-button small" onClick={handleAdminLogout}>
            Logout
          </button>
        )}
      </div>
      <textarea 
        ref={input} 
        aria-label={`Note for ayah ${verseKey}`} 
        value={text} 
        maxLength={20000} 
        onChange={(event) => { 
          setText(event.target.value); 
          setDiscard(false); 
        }}
        placeholder="Write your reflection… Paste a YouTube link or an audio URL to add a live player." 
      />
      <div className="between">
        <span className="eyebrow">LIVE PREVIEW</span>
        <small className="muted">{text.length.toLocaleString()} / 20,000</small>
      </div>
      <NotePreview text={text} />
      <p className="muted small">Media loads from its original host. Never paste private recording links unless you trust the host.</p>
      {discard && <div className="notice" role="alert">You have unsaved changes. <button onClick={onClose}>Discard changes</button></div>}
      {error && <div className="notice" role="alert">{error}</div>}
      <div className="dialog-actions">
        <button className="button secondary" onClick={close}>Cancel</button>
        <button className="button" disabled={!ready} onClick={() => { if (saveNote(verseKey, text)) onClose(); }}>
          <Save size={16} /> Save note
        </button>
      </div>
    </dialog>

    <AdminLoginDialog
      isOpen={showLoginDialog}
      onClose={() => setShowLoginDialog(false)}
      onLogin={handleAdminLogin}
    />
  </>;
}
