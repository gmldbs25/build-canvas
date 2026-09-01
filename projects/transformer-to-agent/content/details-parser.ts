export type DetailBlock =
  | { type: "heading"; level: 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "quote"; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "code"; language: string; value: string };

export type ParsedDetailsScene = {
  number: string;
  title: string;
  blocks: DetailBlock[];
};

export type ParsedDetailsArticle = {
  order: string[];
  byNumber: Record<string, ParsedDetailsScene>;
};

/**
 * Parse the authoritative Details manuscript into ordered presentation blocks.
 * The parser intentionally supports only the small Markdown surface used by the
 * Work 3 manuscript so the source document remains the single copy authority.
 */
export function parseDetailsArticle(source: string): ParsedDetailsArticle {
  const order: string[] = [];
  const byNumber: Record<string, ParsedDetailsScene> = {};
  let current: ParsedDetailsScene | null = null;
  let paragraph: string[] = [];
  let quote: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let code: { language: string; lines: string[] } | null = null;

  const flushParagraph = () => {
    if (current && paragraph.length) {
      current.blocks.push({ type: "paragraph", text: paragraph.join(" ") });
    }
    paragraph = [];
  };

  const flushQuote = () => {
    if (current && quote.length) {
      current.blocks.push({ type: "quote", text: quote.join(" ") });
    }
    quote = [];
  };

  const flushList = () => {
    if (current && list?.items.length) {
      current.blocks.push({ type: "list", ordered: list.ordered, items: list.items });
    }
    list = null;
  };

  const flushText = () => {
    flushParagraph();
    flushQuote();
    flushList();
  };

  for (const line of source.replace(/\r\n/g, "\n").split("\n")) {
    const sceneHeading = line.match(/^# (\d{2}|A1) — (.+)$/);
    if (sceneHeading && code === null) {
      flushText();
      const [, number, title] = sceneHeading;
      current = { number, title, blocks: [] };
      order.push(number);
      byNumber[number] = current;
      continue;
    }

    if (!current) continue;

    const fence = line.match(/^```(.*)$/);
    if (fence) {
      if (code === null) {
        flushText();
        code = { language: fence[1].trim(), lines: [] };
      } else {
        current.blocks.push({
          type: "code",
          language: code.language,
          value: code.lines.join("\n"),
        });
        code = null;
      }
      continue;
    }

    if (code) {
      code.lines.push(line);
      continue;
    }

    const heading = line.match(/^(#{2,3}) (.+)$/);
    if (heading) {
      flushText();
      current.blocks.push({
        type: "heading",
        level: heading[1].length as 2 | 3,
        text: heading[2],
      });
      continue;
    }

    if (line === "---") {
      flushText();
      continue;
    }

    const quoteLine = line.match(/^>\s?(.*)$/);
    if (quoteLine) {
      flushParagraph();
      flushList();
      quote.push(quoteLine[1]);
      continue;
    }

    const orderedItem = line.match(/^\d+\.\s+(.*)$/);
    const unorderedItem = line.match(/^-\s+(.*)$/);
    const item = orderedItem ?? unorderedItem;
    if (item) {
      flushParagraph();
      flushQuote();
      const ordered = Boolean(orderedItem);
      if (!list || list.ordered !== ordered) {
        flushList();
        list = { ordered, items: [] };
      }
      list.items.push(item[1]);
      continue;
    }

    if (!line.trim()) {
      flushText();
      continue;
    }

    flushQuote();
    flushList();
    paragraph.push(line.trim());
  }

  flushText();

  if (code !== null) {
    throw new Error("Unclosed code fence in Work 3 Details manuscript.");
  }

  return { order, byNumber };
}
