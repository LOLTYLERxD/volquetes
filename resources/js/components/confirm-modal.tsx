"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

export interface ConfirmModalProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "primary";
  icon?: React.ReactNode;
  /** Extra content below description (e.g. nota field) */
  children?: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}

const VARIANT_STYLES = {
  danger: {
    iconBg: "linear-gradient(135deg, #ff4f4f18, #ff4f4f30)",
    iconBorder: "#ff4f4f35",
    confirmBg: "#ff4f4f",
    confirmHover: "#ff6b6b",
    confirmColor: "#fff",
  },
  warning: {
    iconBg: "linear-gradient(135deg, #f59e0b18, #f59e0b30)",
    iconBorder: "#f59e0b35",
    confirmBg: "#f59e0b",
    confirmHover: "#fbbf24",
    confirmColor: "#0f1117",
  },
  primary: {
    iconBg: "linear-gradient(135deg, #4f7cff18, #4f7cff30)",
    iconBorder: "#4f7cff35",
    confirmBg: "#4f7cff",
    confirmHover: "#6690ff",
    confirmColor: "#fff",
  },
};

export default function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "primary",
  icon,
  children,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
      if (e.key === "Enter" && !children) onConfirm();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onCancel, onConfirm, children]);

  if (!open) return null;

  const vs = VARIANT_STYLES[variant];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

        .confirm-overlay {
          position: fixed; inset: 0; z-index: 9999;
          display: flex; align-items: center; justify-content: center;
          background: rgba(5, 7, 12, 0.78);
          backdrop-filter: blur(6px);
          padding: 16px;
          animation: confirmOverlayIn 0.18s ease;
          font-family: 'DM Sans', system-ui, sans-serif;
        }
        @keyframes confirmOverlayIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .confirm-card {
          width: 100%; max-width: 380px;
          background: #0f1117;
          border: 1px solid #2a2d3a;
          border-radius: 16px;
          box-shadow: 0 24px 64px rgba(0,0,0,0.75), 0 0 0 1px #ffffff05;
          animation: confirmCardIn 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
          overflow: hidden;
        }
        @keyframes confirmCardIn {
          from { opacity: 0; transform: scale(0.93) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        .confirm-input {
          width: 100%; box-sizing: border-box;
          background: #1a1d27;
          border: 1px solid #2a2d3a;
          border-radius: 9px;
          padding: 10px 14px;
          font-size: 13px; color: #e2e5f0;
          font-family: 'DM Sans', system-ui, sans-serif;
          outline: none;
          resize: none;
          transition: border-color 0.15s, background 0.15s;
        }
        .confirm-input:focus { border-color: #4f7cff; background: #1e2130; }
        .confirm-input::placeholder { color: #3d4260; }
      `}</style>

      <div
        className="confirm-overlay"
        onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}
      >
        <div className="confirm-card">
          {/* Header */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "18px 20px 16px",
            borderBottom: "1px solid #1e2130",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {icon && (
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: vs.iconBg,
                  border: `1px solid ${vs.iconBorder}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {icon}
                </div>
              )}
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#e8ecf8", margin: 0, lineHeight: 1.2 }}>
                  {title}
                </h3>
                {description && (
                  <p style={{ fontSize: 12, color: "#4a4f6a", margin: "3px 0 0", lineHeight: 1.5 }}>
                    {description}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onCancel}
              style={{
                width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                background: "#1a1d27", border: "1px solid #2a2d3a",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
              }}
              aria-label="Cerrar"
            >
              <X size={14} color="#6b7290" />
            </button>
          </div>

          {/* Body (optional extra content like nota field) */}
          {children && (
            <div style={{ padding: "16px 20px 0" }}>
              {children}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: 8, padding: "16px 20px 20px" }}>
            <button
              onClick={onCancel}
              style={{
                flex: 1, padding: "10px",
                borderRadius: 9, background: "#1a1d27",
                border: "1px solid #2a2d3a",
                fontSize: 13, fontWeight: 600, color: "#6b7290",
                cursor: "pointer", transition: "all 0.15s",
                fontFamily: "'DM Sans', system-ui, sans-serif",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#9ba3c0"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#6b7290"; }}
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              style={{
                flex: 1, padding: "10px",
                borderRadius: 9,
                background: vs.confirmBg,
                border: "none",
                fontSize: 13, fontWeight: 600, color: vs.confirmColor,
                cursor: "pointer", transition: "all 0.15s",
                fontFamily: "'DM Sans', system-ui, sans-serif",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = vs.confirmHover; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = vs.confirmBg; }}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}