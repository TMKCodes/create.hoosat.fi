import React, { useState } from "react";
import { useTranslation } from "react-i18next";

type PingState =
  | { kind: "idle" }
  | { kind: "pending" }
  | { kind: "done"; reply: string; ms: number }
  | { kind: "error" };

/**
 * Calls the /api/ping route of this server and shows the round-trip time.
 */
export const PingDemo = () => {
  const { t } = useTranslation();
  const [state, setState] = useState<PingState>({ kind: "idle" });

  const ping = async () => {
    setState({ kind: "pending" });
    const started = performance.now();
    try {
      const response = await fetch("/api/ping", { cache: "no-store" });
      if (!response.ok) throw new Error(String(response.status));
      const reply = await response.text();
      setState({ kind: "done", reply, ms: Math.max(1, Math.round(performance.now() - started)) });
    } catch {
      setState({ kind: "error" });
    }
  };

  const message =
    state.kind === "done" ? t("demo.result", { reply: state.reply, ms: state.ms })
    : state.kind === "error" ? t("demo.error")
    : state.kind === "pending" ? t("demo.pending")
    : t("demo.idle");

  return (
    <div className="ping">
      <button type="button" className="button button-primary" onClick={ping} disabled={state.kind === "pending"}>
        {t("demo.button")}
      </button>
      <output className={`ping-output ping-${state.kind}`} aria-live="polite">
        <span className="ping-dot" aria-hidden="true" />
        <span>GET /api/ping</span>
        <span className="ping-message">{message}</span>
      </output>
    </div>
  );
};
