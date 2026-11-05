import React from "react";
import Image from "next/image";

type ContentNode =
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "h4"; text: string }
  | { type: "p"; text: string }
  | { type: "blockquote"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "image"; src: string; alt: string };

function isSafeUrl(url: string): boolean {
  try {
    if (url.startsWith("/") || url.startsWith("#")) return true;
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export function parseMarkdownToNodes(markdown: string): ContentNode[] {
  const lines = markdown.split(/\r?\n/);
  const nodes: ContentNode[] = [];
  let currentList: { type: "ul" | "ol"; items: string[] } | null = null;
  let paragraphBuffer: string[] = [];

  function flushParagraph() {
    if (paragraphBuffer.length > 0) {
      nodes.push({ type: "p", text: paragraphBuffer.join(" ") });
      paragraphBuffer = [];
    }
  }

  function flushList() {
    if (currentList) {
      nodes.push(currentList);
      currentList = null;
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i] ?? "";
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    // Image: ![alt](url)
    const imgMatch = line.match(/^!\[([^\]]*)\]\((.+)\)$/);
    if (imgMatch) {
      flushParagraph();
      flushList();
      const alt = imgMatch[1]?.trim() ?? "";
      const src = imgMatch[2]?.trim() ?? "";
      if (isSafeUrl(src)) {
        nodes.push({ type: "image", src, alt });
      }
      continue;
    }

    // Heading 2: ##
    if (line.startsWith("## ")) {
      flushParagraph();
      flushList();
      nodes.push({ type: "h2", text: line.replace(/^##\s+/, "") });
      continue;
    }

    // Heading 3: ###
    if (line.startsWith("### ")) {
      flushParagraph();
      flushList();
      nodes.push({ type: "h3", text: line.replace(/^###\s+/, "") });
      continue;
    }

    // Heading 4: ####
    if (line.startsWith("#### ")) {
      flushParagraph();
      flushList();
      nodes.push({ type: "h4", text: line.replace(/^####\s+/, "") });
      continue;
    }

    // Blockquote: >
    if (line.startsWith("> ")) {
      flushParagraph();
      flushList();
      nodes.push({ type: "blockquote", text: line.replace(/^>\s+/, "") });
      continue;
    }

    // Unordered list item: - or *
    const ulMatch = line.match(/^[-*]\s+(.*)$/);
    if (ulMatch) {
      flushParagraph();
      if (!currentList || currentList.type !== "ul") {
        flushList();
        currentList = { type: "ul", items: [] };
      }
      currentList.items.push(ulMatch[1]?.trim() ?? "");
      continue;
    }

    // Ordered list item: 1.
    const olMatch = line.match(/^\d+\.\s+(.*)$/);
    if (olMatch) {
      flushParagraph();
      if (!currentList || currentList.type !== "ol") {
        flushList();
        currentList = { type: "ol", items: [] };
      }
      currentList.items.push(olMatch[1]?.trim() ?? "");
      continue;
    }

    // Regular line inside a paragraph
    flushList();
    paragraphBuffer.push(line);
  }

  flushParagraph();
  flushList();

  return nodes;
}

// Parses inline bold, italic, code and links into React nodes safely
export function renderInlineFormattedText(text: string): React.ReactNode {
  // Regex to split by links [text](url), bold **text**, italic *text*, code `text`
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(renderBasicInline(text.substring(lastIndex, match.index)));
    }
    const linkText = match[1] ?? "";
    const href = match[2]?.trim() ?? "#";
    const safe = isSafeUrl(href);
    const isExternal = href.startsWith("http");

    parts.push(
      safe ? (
        <a
          key={`link-${match.index}`}
          href={href}
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noopener noreferrer" : undefined}
          className="font-medium text-forest underline decoration-gold underline-offset-4 hover:text-gold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold rounded"
        >
          {linkText}
        </a>
      ) : (
        linkText
      ),
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(renderBasicInline(text.substring(lastIndex)));
  }

  return parts;
}

function renderBasicInline(text: string): React.ReactNode {
  // Split by bold **word**
  const boldParts = text.split(/\*\*([^*]+)\*\*/g);
  return boldParts.map((boldChunk, i) => {
    if (i % 2 === 1) {
      return <strong key={i} className="font-semibold text-forest">{boldChunk}</strong>;
    }
    // Split by italic *word*
    const italicParts = boldChunk.split(/\*([^*]+)\*/g);
    return italicParts.map((italicChunk, j) => {
      if (j % 2 === 1) {
        return <em key={`${i}-${j}`} className="italic">{italicChunk}</em>;
      }
      return italicChunk;
    });
  });
}

export function BlogContentRenderer({ content }: { content: string }) {
  const nodes = parseMarkdownToNodes(content);

  return (
    <div className="prose prose-lg max-w-none text-charcoal/80 space-y-6">
      {nodes.map((node, index) => {
        switch (node.type) {
          case "h2":
            return (
              <h2
                key={index}
                className="font-display mt-12 mb-4 text-3xl sm:text-4xl text-forest tracking-[-0.02em]"
              >
                {renderInlineFormattedText(node.text)}
              </h2>
            );
          case "h3":
            return (
              <h3
                key={index}
                className="font-display mt-8 mb-3 text-2xl sm:text-3xl text-forest tracking-[-0.01em]"
              >
                {renderInlineFormattedText(node.text)}
              </h3>
            );
          case "h4":
            return (
              <h4
                key={index}
                className="font-display mt-6 mb-2 text-xl text-forest font-medium"
              >
                {renderInlineFormattedText(node.text)}
              </h4>
            );
          case "p":
            return (
              <p key={index} className="text-base sm:text-lg leading-8 text-charcoal/75 my-4">
                {renderInlineFormattedText(node.text)}
              </p>
            );
          case "blockquote":
            return (
              <blockquote
                key={index}
                className="my-8 border-l-2 border-gold bg-ivory/60 px-6 py-4 italic text-forest text-lg leading-8"
              >
                <p>{renderInlineFormattedText(node.text)}</p>
              </blockquote>
            );
          case "ul":
            return (
              <ul key={index} className="my-6 list-disc pl-6 space-y-2 text-base sm:text-lg leading-7">
                {node.items.map((item, itemIdx) => (
                  <li key={itemIdx}>{renderInlineFormattedText(item)}</li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={index} className="my-6 list-decimal pl-6 space-y-2 text-base sm:text-lg leading-7">
                {node.items.map((item, itemIdx) => (
                  <li key={itemIdx}>{renderInlineFormattedText(item)}</li>
                ))}
              </ol>
            );
          case "image":
            return (
              <figure key={index} className="my-8 overflow-hidden rounded-xl border border-charcoal/10 bg-ivory">
                <div className="relative aspect-[16/9] w-full">
                  <Image
                    src={node.src}
                    alt={node.alt || "Article illustration"}
                    fill
                    sizes="(max-width: 768px) 100vw, 800px"
                    className="object-cover"
                  />
                </div>
                {node.alt && (
                  <figcaption className="p-3 text-center text-xs text-charcoal/60 bg-white/70">
                    {node.alt}
                  </figcaption>
                )}
              </figure>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
