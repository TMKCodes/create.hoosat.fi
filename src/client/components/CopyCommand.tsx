import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { site } from "../../common/site";
import { CheckIcon, CopyIcon } from "./Icons";

/**
 * The install command with a copy button. The button only works after hydration,
 * but the command itself is server rendered and can always be selected by hand.
 */
export const CopyCommand = () => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(site.command);
      setCopied(true);
    } catch {
      // Clipboard access can be denied; the command is still selectable.
    }
  };

  return (
    <div className="command">
      <span className="command-prompt" aria-hidden="true">$</span>
      <code>{site.command}</code>
      <button type="button" className="command-copy js-only" onClick={copy} aria-label={t("hero.copy")} title={t("hero.copy")}>
        {copied ? <CheckIcon /> : <CopyIcon />}
      </button>
      <span className="visually-hidden" role="status">{copied ? t("hero.copied") : ""}</span>
    </div>
  );
};
