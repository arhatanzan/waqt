"use client";

import { useEffect, useRef, useState } from "react";
import { Lock, X } from "lucide-react";
import { adminSession } from "@/lib/admin-auth-client";

export function AdminLoginDialog({
  isOpen,
  onClose,
  onLogin,
}: {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (isOpen) {
      dialog.current?.showModal();
    } else {
      dialog.current?.close();
      setUsername("");
      setPassword("");
      setError("");
    }
  }, [isOpen]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!await adminSession("POST", { username, password })) {
        throw new Error("The server did not create an admin session.");
      }
      onLogin();
      setUsername("");
      setPassword("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Authentication failed"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <dialog
      ref={dialog}
      className="admin-login-dialog"
      aria-labelledby="admin-login-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div className="dialog-heading">
        <div>
          <Lock size={20} />
          <h2 id="admin-login-title">Admin Login</h2>
        </div>
        <button
          className="icon-button"
          aria-label="Close"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="login-form">
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter admin username"
            disabled={loading}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter admin password"
            disabled={loading}
            required
          />
        </div>

        {error && (
          <div className="notice error-notice" role="alert">
            {error}
          </div>
        )}

        <div className="dialog-actions">
          <button
            type="button"
            className="button secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="button"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
