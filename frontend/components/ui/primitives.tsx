"use client";

import React from "react";

// ─── Icon ─────────────────────────────────────────────────────────────────────

const ICON_PATHS: Record<string, React.ReactNode> = {
  overview:     <><rect x="3" y="3" width="8" height="10" rx="1.5"/><rect x="13" y="3" width="8" height="6" rx="1.5"/><rect x="13" y="11" width="8" height="10" rx="1.5"/><rect x="3" y="15" width="8" height="6" rx="1.5"/></>,
  tenants:      <><path d="M3 21V8l6-4 6 4v13"/><path d="M15 12h6v9"/><path d="M7 12h0M7 16h0M11 12h0M11 16h0M18 16h0M18 19h0"/></>,
  users:        <><circle cx="9" cy="8" r="3.2"/><circle cx="17" cy="10" r="2.4"/><path d="M3.5 20c.6-3 3-5 5.5-5s4.9 2 5.5 5"/><path d="M15 20c.2-1.8 1.3-3.2 3-3.7"/></>,
  permissions:  <><path d="M12 3l8 3v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z"/><path d="M9 12l2.2 2.2L15.5 10"/></>,
  entities:     <><ellipse cx="12" cy="5.5" rx="8" ry="2.5"/><path d="M4 5.5v13c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5v-13"/><path d="M4 12c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5"/></>,
  records:      <><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M3 14h18M9 4v16"/></>,
  automations:  <><path d="M13 3L4 14h7l-1 7 9-11h-7z"/></>,
  settings:     <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.6a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82v0a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"/></>,
  search:       <><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></>,
  bell:         <><path d="M6 8a6 6 0 1112 0c0 7 3 7 3 9H3c0-2 3-2 3-9z"/><path d="M10 21a2 2 0 004 0"/></>,
  help:         <><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5A2.5 2.5 0 0114 11c0 1.5-2 2-2 3.5"/><path d="M12 18h0"/></>,
  plus:         <><path d="M12 5v14M5 12h14"/></>,
  download:     <><path d="M12 3v12M7 10l5 5 5-5"/><path d="M4 19h16"/></>,
  filter:       <><path d="M3 5h18l-7 9v6l-4-2v-4z"/></>,
  sort:         <><path d="M7 4v16M4 7l3-3 3 3M17 20V4M14 17l3 3 3-3"/></>,
  group:        <><rect x="3" y="4" width="8" height="7" rx="1"/><rect x="13" y="4" width="8" height="7" rx="1"/><rect x="3" y="13" width="18" height="7" rx="1"/></>,
  table:        <><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M9 4v16"/></>,
  kanban:       <><rect x="3" y="4" width="5" height="16" rx="1"/><rect x="10" y="4" width="5" height="10" rx="1"/><rect x="17" y="4" width="4" height="13" rx="1"/></>,
  cards:        <><rect x="3" y="4" width="8" height="7" rx="1.5"/><rect x="13" y="4" width="8" height="7" rx="1.5"/><rect x="3" y="13" width="8" height="7" rx="1.5"/><rect x="13" y="13" width="8" height="7" rx="1.5"/></>,
  dots:         <><circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/></>,
  edit:         <><path d="M4 20h4l11-11-4-4L4 16z"/></>,
  drag:         <><circle cx="9" cy="6" r="1.3"/><circle cx="9" cy="12" r="1.3"/><circle cx="9" cy="18" r="1.3"/><circle cx="15" cy="6" r="1.3"/><circle cx="15" cy="12" r="1.3"/><circle cx="15" cy="18" r="1.3"/></>,
  chevron:      <><path d="M6 9l6 6 6-6"/></>,
  check:        <><path d="M5 12l5 5 9-11"/></>,
  x:            <><path d="M6 6l12 12M18 6L6 18"/></>,
  minus:        <><path d="M6 12h12"/></>,
  arrow:        <><path d="M5 12h14M13 6l6 6-6 6"/></>,
  sparkle:      <><path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/></>,
  import:       <><path d="M12 21V9M7 14l5-5 5 5"/><path d="M4 5h16"/></>,
  calendar:     <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></>,
  lightning:    <><path d="M13 3L4 14h7l-1 7 9-11h-7z"/></>,
  shield:       <><path d="M12 3l8 3v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z"/></>,
  logo:         <><path d="M12 3l9 5v8l-9 5-9-5V8z"/><path d="M12 12l9-4M12 12l-9-4M12 12v9"/></>,
};

export function Icon({
  name,
  size = 18,
  stroke = "currentColor",
  style,
}: {
  name: string;
  size?: number;
  stroke?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={stroke} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"
      style={style}
    >
      {ICON_PATHS[name] ?? null}
    </svg>
  );
}

// ─── Pill ────────────────────────────────────────────────────────────────────

type PillTone = "neutral" | "amber" | "green" | "red" | "blue" | "violet" | "muted";

const PILL_TONES: Record<PillTone, { bg: string; color: string }> = {
  neutral: { bg: "rgba(15,47,56,0.09)",   color: "#0f2f38" },
  amber:   { bg: "rgba(211,109,63,0.16)", color: "#9d3f14" },
  green:   { bg: "rgba(22,87,78,0.15)",   color: "#155a52" },
  red:     { bg: "rgba(156,40,40,0.14)",  color: "#7a2020" },
  blue:    { bg: "rgba(28,61,88,0.14)",   color: "#1c3d58" },
  violet:  { bg: "rgba(88,58,139,0.14)",  color: "#4c3075" },
  muted:   { bg: "rgba(15,47,56,0.06)",   color: "#51616d" },
};

export function Pill({
  children,
  tone = "neutral",
  icon,
}: {
  children: React.ReactNode;
  tone?: PillTone;
  icon?: string;
}) {
  const t = PILL_TONES[tone] ?? PILL_TONES.neutral;
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        background: t.bg, color: t.color,
        padding: "3px 9px", borderRadius: 999,
        fontSize: 11, fontWeight: 700, letterSpacing: ".04em",
        whiteSpace: "nowrap",
      }}
    >
      {icon && <Icon name={icon} size={11} stroke={t.color} />}
      {children}
    </span>
  );
}

// ─── Card ────────────────────────────────────────────────────────────────────

export function Card({
  children,
  style,
  onClick,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: "rgba(255,255,255,0.86)",
        border: "1px solid var(--line)",
        borderRadius: 16, padding: 18,
        boxShadow: "0 2px 0 rgba(19,33,47,0.02)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

export function StatCard({
  label,
  value,
  delta,
  sub,
  icon,
}: {
  label: string;
  value: string | number;
  delta?: string;
  sub?: string;
  icon?: string;
}) {
  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div
          style={{
            fontSize: 11, color: "var(--muted)", fontWeight: 700,
            letterSpacing: ".12em", textTransform: "uppercase",
          }}
        >
          {label}
        </div>
        {icon && (
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: "rgba(211,109,63,0.10)", color: "#b44a1e",
            display: "grid", placeItems: "center",
          }}>
            <Icon name={icon} size={15} stroke="#b44a1e" />
          </div>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 10 }}>
        <div
          style={{
            fontFamily: '"Iowan Old Style","Palatino Linotype",serif',
            fontSize: 34, color: "var(--foreground)", letterSpacing: "-0.02em",
          }}
        >
          {value}
        </div>
        {delta && (
          <span
            style={{
              fontSize: 12, fontWeight: 700,
              color: delta.startsWith("-") ? "#7a2020" : "#155a52",
            }}
          >
            {delta}
          </span>
        )}
      </div>
      {sub && <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>{sub}</div>}
    </Card>
  );
}

// ─── Buttons ──────────────────────────────────────────────────────────────────

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { icon?: string };

export function PrimaryBtn({ children, style, icon, ...rest }: BtnProps) {
  return (
    <button
      {...rest}
      style={{
        border: 0, borderRadius: 10,
        background: "linear-gradient(135deg,#0d1b26,#1f3a52)",
        color: "#fff", padding: "10px 16px", fontWeight: 600, fontSize: 13,
        cursor: "pointer", boxShadow: "0 10px 24px rgba(13,27,38,0.26)",
        display: "inline-flex", alignItems: "center", gap: 8,
        opacity: rest.disabled ? 0.6 : 1,
        ...style,
      }}
    >
      {icon && <Icon name={icon} size={15} />}
      {children}
    </button>
  );
}

export function GhostBtn({ children, style, icon, ...rest }: BtnProps) {
  return (
    <button
      {...rest}
      style={{
        border: "1px solid var(--line)", borderRadius: 10,
        background: "rgba(255,255,255,0.92)",
        color: "var(--foreground)", padding: "9px 14px", fontWeight: 600, fontSize: 13,
        cursor: "pointer",
        display: "inline-flex", alignItems: "center", gap: 7,
        opacity: rest.disabled ? 0.6 : 1,
        ...style,
      }}
    >
      {icon && <Icon name={icon} size={15} />}
      {children}
    </button>
  );
}

export function AccentBtn({ children, style, icon, ...rest }: BtnProps) {
  return (
    <button
      {...rest}
      style={{
        border: 0, borderRadius: 10,
        background: "linear-gradient(135deg,#d36d3f,#b44a1e)",
        color: "#fff", padding: "10px 16px", fontWeight: 600, fontSize: 13,
        cursor: "pointer", boxShadow: "0 10px 24px rgba(211,109,63,0.34)",
        display: "inline-flex", alignItems: "center", gap: 8,
        opacity: rest.disabled ? 0.6 : 1,
        ...style,
      }}
    >
      {icon && <Icon name={icon} size={15} />}
      {children}
    </button>
  );
}

// ─── FilterChip ───────────────────────────────────────────────────────────────

export function FilterChip({
  label,
  count,
  active,
  onClick,
  icon,
}: {
  label: string;
  count?: number;
  active?: boolean;
  onClick?: () => void;
  icon?: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        padding: "7px 12px", borderRadius: 999,
        border: active ? "1px solid #0d1b26" : "1px solid var(--line)",
        background: active ? "#0d1b26" : "rgba(255,255,255,0.9)",
        color: active ? "#fff" : "var(--foreground)",
        fontSize: 12, fontWeight: 600, cursor: "pointer",
      }}
    >
      {icon && <Icon name={icon} size={13} stroke={active ? "#f6c79a" : "var(--muted)"} />}
      <span>{label}</span>
      {count !== undefined && (
        <span
          style={{
            background: active ? "rgba(255,255,255,0.2)" : "rgba(19,33,47,0.06)",
            color: active ? "#fff" : "var(--muted)",
            padding: "1px 6px", borderRadius: 999, fontSize: 11,
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}

// ─── SearchInput ──────────────────────────────────────────────────────────────

export function SearchInput({
  placeholder,
  value,
  onChange,
  style,
}: {
  placeholder?: string;
  value?: string;
  onChange?: (v: string) => void;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: 8,
        background: "rgba(255,255,255,0.88)",
        border: "1px solid var(--line)", borderRadius: 10,
        padding: "8px 12px", width: 280,
        ...style,
      }}
    >
      <Icon name="search" size={15} stroke="var(--muted)" />
      <input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        style={{
          border: 0, outline: "none", background: "transparent",
          flex: 1, fontSize: 13,
        }}
      />
    </div>
  );
}

// ─── Table styles ─────────────────────────────────────────────────────────────

export const TH_STYLE: React.CSSProperties = {
  padding: "12px 14px",
  fontSize: 11, fontWeight: 700, letterSpacing: ".1em",
  textTransform: "uppercase", color: "var(--muted)",
  borderBottom: "1px solid var(--line)",
  textAlign: "left",
};

export const TD_STYLE: React.CSSProperties = {
  padding: "12px 14px",
  fontSize: 13,
};

// ─── Modal ────────────────────────────────────────────────────────────────────

export function Modal({
  children,
  onClose,
  width = 420,
}: {
  children: React.ReactNode;
  onClose: () => void;
  width?: number;
}) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(19,33,47,0.4)", backdropFilter: "blur(8px)",
        display: "grid", placeItems: "center",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "rgba(253,251,247,0.98)", border: "1px solid var(--line)",
          borderRadius: 20, padding: 28, width,
          boxShadow: "0 20px 60px rgba(19,33,47,0.24)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ─── Drawer (slide-over from right) ──────────────────────────────────────────

export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  width = 480,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  width?: number;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  // Close on Escape
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 300,
        display: "flex", justifyContent: "flex-end",
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "absolute", inset: 0,
          background: "rgba(15,47,56,0.35)",
          backdropFilter: "blur(4px)",
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: "relative", zIndex: 1,
          width, maxWidth: "100vw",
          background: "rgba(253,251,247,0.98)",
          borderLeft: "1px solid var(--line)",
          boxShadow: "-24px 0 60px rgba(15,47,56,0.18)",
          display: "flex", flexDirection: "column",
          height: "100vh",
          animation: "slideIn 200ms ease",
        }}
      >
        {/* Header */}
        <div style={{
          padding: "24px 28px 20px",
          borderBottom: "1px solid var(--line)",
          display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16,
          flexShrink: 0,
        }}>
          <div>
            <h2 style={{
              fontFamily: '"Iowan Old Style","Palatino Linotype",serif',
              fontSize: 26, margin: 0, letterSpacing: "-0.01em", color: "var(--foreground)",
            }}>
              {title}
            </h2>
            {subtitle && (
              <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 5 }}>{subtitle}</div>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              width: 34, height: 34, borderRadius: 9,
              border: "1px solid var(--line)", background: "rgba(255,255,255,0.9)",
              display: "grid", placeItems: "center", cursor: "pointer", flexShrink: 0,
              color: "var(--muted)",
            }}
          >
            <Icon name="x" size={15} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div style={{
            borderTop: "1px solid var(--line)", padding: "18px 28px",
            display: "flex", gap: 10, justifyContent: "flex-end",
            background: "rgba(255,255,255,0.6)", flexShrink: 0,
          }}>
            {footer}
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ─── Field (form input group) ─────────────────────────────────────────────────

export function Field({
  label,
  hint,
  error,
  required,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{
        fontSize: 13, fontWeight: 600, color: "var(--foreground)",
        display: "flex", alignItems: "center", gap: 4,
      }}>
        {label}
        {required && <span style={{ color: "#b44a1e", fontSize: 14, lineHeight: 1 }}>*</span>}
      </label>
      {children}
      {hint && !error && (
        <div style={{ fontSize: 11.5, color: "var(--muted)" }}>{hint}</div>
      )}
      {error && (
        <div style={{ fontSize: 11.5, color: "#8a2f2f", fontWeight: 600 }}>{error}</div>
      )}
    </div>
  );
}

// ─── Toggle (styled boolean switch) ──────────────────────────────────────────

export function Toggle({
  checked,
  onChange,
  label,
  hint,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <div
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onChange(!checked)}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.5 : 1,
        userSelect: "none",
      }}
    >
      <div
        style={{
          position: "relative",
          width: 38, height: 21, borderRadius: 21, flexShrink: 0,
          background: checked
            ? "linear-gradient(135deg,#1c3d58,#0d1b26)"
            : "rgba(19,33,47,0.16)",
          transition: "background 0.18s",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 2.5,
            left: checked ? 19 : 2.5,
            width: 16, height: 16, borderRadius: "50%",
            background: "#fff",
            boxShadow: "0 1px 4px rgba(0,0,0,0.22)",
            transition: "left 0.18s",
          }}
        />
      </div>
      {(label || hint) && (
        <div>
          {label && (
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)", lineHeight: 1.3 }}>
              {label}
            </div>
          )}
          {hint && (
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 1 }}>{hint}</div>
          )}
        </div>
      )}
    </div>
  );
}

export const inputStyle: React.CSSProperties = {
  width: "100%", border: "1px solid var(--line)", borderRadius: 10,
  background: "rgba(255,255,255,0.9)", padding: "10px 14px",
  fontSize: 13, color: "var(--foreground)", outline: "none",
  boxSizing: "border-box",
};

export const inputErrorStyle: React.CSSProperties = {
  ...({} as React.CSSProperties),
  borderColor: "rgba(138,47,47,0.5)",
  background: "rgba(138,47,47,0.04)",
};

// ─── Empty state ──────────────────────────────────────────────────────────────

export function EmptyState({
  icon,
  title,
  description,
  children,
}: {
  icon?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <Card>
      <div style={{ padding: "40px 0", textAlign: "center" }}>
        {icon && <div style={{ fontSize: 36, marginBottom: 14 }}>{icon}</div>}
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{title}</div>
        {description && (
          <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 20 }}>{description}</div>
        )}
        {children}
      </div>
    </Card>
  );
}
