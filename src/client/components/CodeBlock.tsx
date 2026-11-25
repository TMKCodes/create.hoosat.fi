import React, { ReactNode } from "react";

type Language = "ts" | "shell" | "text";

const tsTokens =
  /(\/\/.*$)|("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`)|\b(import|from|export|const|let|return|async|await|new|type|function|if|else|default)\b|(<\/?[A-Z][A-Za-z]*)/gm;

/**
 * A tiny, deterministic highlighter. It produces the same output on the server and in the browser,
 * so it is safe to use during hydration and ships no extra dependency.
 */
const highlight = (code: string, language: Language): ReactNode[] => {
  if (language === "text") {
    return [code];
  }
  if (language === "shell") {
    return code.split("\n").flatMap((line, index) => {
      const content: ReactNode = line.startsWith("$ ") ? (
        <React.Fragment key={index}>
          <span className="tok-prompt">$ </span>
          {line.slice(2)}
        </React.Fragment>
      ) : line.startsWith("#") ? (
        <span key={index} className="tok-comment">{line}</span>
      ) : (
        <span key={index} className="tok-output">{line}</span>
      );
      return index === 0 ? [content] : ["\n", content];
    });
  }
  const nodes: ReactNode[] = [];
  let last = 0;
  for (const match of code.matchAll(tsTokens)) {
    const index = match.index ?? 0;
    if (index > last) {
      nodes.push(code.slice(last, index));
    }
    const className = match[1] ? "tok-comment" : match[2] ? "tok-string" : match[3] ? "tok-keyword" : "tok-tag";
    nodes.push(<span key={index} className={className}>{match[0]}</span>);
    last = index + match[0].length;
  }
  nodes.push(code.slice(last));
  return nodes;
};

type CodeBlockProps = {
  code: string;
  language?: Language;
  label?: string;
};

export const CodeBlock = ({ code, language = "ts", label }: CodeBlockProps) => (
  <figure className="code-block">
    {label && (
      <figcaption>
        <span className="code-dots" aria-hidden="true"><i /><i /><i /></span>
        {label}
      </figcaption>
    )}
    <pre tabIndex={0}>
      <code>{highlight(code.trim(), language)}</code>
    </pre>
  </figure>
);
