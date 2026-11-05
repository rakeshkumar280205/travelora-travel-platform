import { describe, expect, it } from "vitest";
import { sanitizeBlogContent } from "@/lib/validation/blog-schemas";
import { parseMarkdownToNodes } from "@/components/blog/blog-content-renderer";

describe("blog content sanitizer and markdown parser", () => {
  it("strips script tags and inline handlers", () => {
    const dirty = "Hello world <script>alert(1)</script> and <b onclick='evil()'>bold</b>";
    const cleaned = sanitizeBlogContent(dirty);
    expect(cleaned).not.toContain("<script>");
    expect(cleaned).not.toContain("alert(1)");
    expect(cleaned).not.toContain("onclick");
  });

  it("neutralizes javascript: protocol in markdown links", () => {
    const dirty = "Check out this [secret deal](javascript:alert(1)) today!";
    const cleaned = sanitizeBlogContent(dirty);
    expect(cleaned).not.toContain("javascript:");
    expect(cleaned).toContain("[secret deal](#)");
  });

  it("parses headings and paragraphs into structured AST nodes", () => {
    const markdown = [
      "## Main Heading",
      "",
      "This is a descriptive paragraph about Kerala.",
      "",
      "### Subheading",
      "",
      "> A quote from an expedition leader.",
    ].join("\n");

    const nodes = parseMarkdownToNodes(markdown);
    expect(nodes).toEqual([
      { type: "h2", text: "Main Heading" },
      { type: "p", text: "This is a descriptive paragraph about Kerala." },
      { type: "h3", text: "Subheading" },
      { type: "blockquote", text: "A quote from an expedition leader." },
    ]);
  });

  it("parses bullet and numbered lists properly", () => {
    const markdown = [
      "- Item One",
      "- Item Two",
      "- Item Three",
      "",
      "1. First step",
      "2. Second step",
    ].join("\n");

    const nodes = parseMarkdownToNodes(markdown);
    expect(nodes).toEqual([
      { type: "ul", items: ["Item One", "Item Two", "Item Three"] },
      { type: "ol", items: ["First step", "Second step"] },
    ]);
  });

  it("preserves safe images and drops unsafe image URLs", () => {
    const markdown = [
      "![Safe tea plantation](https://images.unsplash.com/photo-123)",
      "![Malicious SVG](javascript:alert(document.cookie))",
      "![Local image](/images/banner.jpg)",
    ].join("\n");

    const nodes = parseMarkdownToNodes(markdown);
    expect(nodes).toEqual([
      {
        type: "image",
        src: "https://images.unsplash.com/photo-123",
        alt: "Safe tea plantation",
      },
      {
        type: "image",
        src: "/images/banner.jpg",
        alt: "Local image",
      },
    ]);
  });
});
