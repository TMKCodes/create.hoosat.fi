import React from "react";
import { useTranslation } from "react-i18next";
import { formatMs, PageSpeed, usePageSpeed } from "../performance";

const metrics: (keyof PageSpeed)[] = ["server", "firstByte", "firstPaint", "interactive", "loaded"];

/**
 * Live timings of the visitor's own page load, shown as a row of stat tiles.
 * Server HTML shows placeholders; the numbers are filled in by the browser after hydration.
 */
export const SpeedPanel = () => {
  const { t, i18n } = useTranslation();
  const speed = usePageSpeed();
  return (
    <div className="speed">
      <dl className="speed-tiles">
        {metrics.map((metric) => {
          const value = speed?.[metric];
          return (
            <div key={metric} className={`speed-tile${metric === "server" ? " speed-tile-hero" : ""}`}>
              <dt>{t(`speed.${metric}.label`)}</dt>
              <dd>
                <span className="speed-value">
                  {value !== undefined ? formatMs(value, i18n.language) : speed ? t("speed.unavailable") : "…"}
                </span>
                {value !== undefined && <span className="speed-unit">ms</span>}
              </dd>
              <dd className="speed-hint">{t(`speed.${metric}.hint`)}</dd>
            </div>
          );
        })}
      </dl>
      <div className="speed-footer">
        <p>{t("speed.note")}</p>
        <button type="button" className="button button-ghost" onClick={() => window.location.reload()}>
          {t("speed.again")}
        </button>
      </div>
    </div>
  );
};

/**
 * A small "server-rendered in X ms" badge for the footer. Empty until the browser reports the timing.
 */
export const SpeedBadge = () => {
  const { t, i18n } = useTranslation();
  const server = usePageSpeed()?.server;
  if (server === undefined) {
    return <span className="speed-badge speed-badge-empty" aria-hidden="true" />;
  }
  return (
    <a href="/#speed" className="speed-badge">
      <span className="speed-badge-dot" aria-hidden="true" />
      {t("speed.badge", { ms: formatMs(server, i18n.language) })}
    </a>
  );
};
