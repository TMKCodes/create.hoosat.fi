import React from "react";

/**
 * Renders a translated string, turning `backticked` parts into <code> elements.
 * Keeps inline code in the translation files readable without HTML.
 */
export const Rich = ({ text }: { text: string }) => (
  <>
    {text.split(/(`[^`]+`)/g).map((part, index) =>
      part.length > 2 && part.startsWith("`") && part.endsWith("`") ? (
        <code key={index}>{part.slice(1, -1)}</code>
      ) : (
        <React.Fragment key={index}>{part}</React.Fragment>
      )
    )}
  </>
);
