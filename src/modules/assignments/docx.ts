// Minimal DOCX -> text -> quiz parser. DOCX is a ZIP with word/document.xml; using Node's
// zlib avoids adding a dependency (and keeps Vercel deploys configuration-free).
import { inflateRawSync } from 'node:zlib';

export interface ParsedQuestion {
  kind: 'single' | 'short';
  prompt: string;
  options: string[];
  answer: string;
  points: number;
}

function findEndOfCentralDirectory(buffer: Buffer): number {
  const min = Math.max(0, buffer.length - 65_557);
  for (let offset = buffer.length - 22; offset >= min; offset -= 1) {
    if (buffer.readUInt32LE(offset) === 0x06054b50) return offset;
  }
  throw new Error('Not a valid DOCX file.');
}

function readEntry(buffer: Buffer, localOffset: number): Buffer {
  if (buffer.readUInt32LE(localOffset) !== 0x04034b50) throw new Error('Invalid DOCX entry.');
  const method = buffer.readUInt16LE(localOffset + 8);
  const nameLength = buffer.readUInt16LE(localOffset + 26);
  const extraLength = buffer.readUInt16LE(localOffset + 28);
  const dataStart = localOffset + 30 + nameLength + extraLength;
  const compressedSize = buffer.readUInt32LE(localOffset + 18);
  const data = buffer.subarray(dataStart, dataStart + compressedSize);
  if (method === 0) return Buffer.from(data);
  if (method === 8) return inflateRawSync(data);
  throw new Error('Unsupported DOCX compression.');
}

function documentXml(buffer: Buffer): string {
  const eocd = findEndOfCentralDirectory(buffer);
  const entries = buffer.readUInt16LE(eocd + 10);
  const start = buffer.readUInt32LE(eocd + 16);
  let offset = start;
  for (let i = 0; i < entries; i += 1) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) throw new Error('Invalid DOCX directory.');
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localOffset = buffer.readUInt32LE(offset + 42);
    const name = buffer.subarray(offset + 46, offset + 46 + nameLength).toString('utf8');
    if (name === 'word/document.xml') {
      return readEntry(buffer, localOffset).toString('utf8');
    }
    offset += 46 + nameLength + extraLength + commentLength;
  }
  throw new Error('DOCX has no document.xml.');
}

function decodeXml(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(Number.parseInt(dec, 10)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

export function extractDocxText(buffer: Buffer): string {
  const xml = documentXml(buffer);
  return decodeXml(
    xml
      .replace(/<w:tab[^>]*\/>/g, '\t')
      .replace(/<w:br[^>]*\/>/g, '\n')
      .replace(/<\/w:p>/g, '\n')
      .replace(/<\/w:tr>/g, '\n')
      .replace(/<[^>]+>/g, ''),
  )
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join('\n');
}

/** Best-effort rich text: headings, bold, italic and simple list paragraphs. */
export function extractDocxMarkdown(buffer: Buffer): string {
  const xml = documentXml(buffer);
  const paragraphs = [...xml.matchAll(/<w:p\b[^>]*>([\s\S]*?)<\/w:p>/g)];
  const lines: string[] = [];
  for (const paragraph of paragraphs) {
    const body = paragraph[1] ?? '';
    const style = body.match(/<w:pStyle[^>]*w:val="([^"]+)"/)?.[1] ?? '';
    const isList = /<w:numPr>/.test(body);
    const runs = [...body.matchAll(/<w:r\b[^>]*>([\s\S]*?)<\/w:r>/g)];
    const text = runs
      .map((run) => {
        const inner = run[1] ?? '';
        const raw = [...inner.matchAll(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g)]
          .map((part) => decodeXml(part[1] ?? ''))
          .join('');
        if (!raw) return '';
        const bold = /<w:b(?:\s|\/?>)/.test(inner);
        const italic = /<w:i(?:\s|\/?>)/.test(inner);
        const wrapped = bold ? `**${raw}**` : italic ? `*${raw}*` : raw;
        return wrapped;
      })
      .join('')
      .trim();
    if (!text) continue;
    const heading = /heading\s*1|title/i.test(style) ? '#' : /heading\s*2/i.test(style) ? '##' : /heading\s*3/i.test(style) ? '###' : '';
    lines.push(heading ? `${heading} ${text}` : isList ? `- ${text}` : text);
  }
  return lines.join('\n\n');
}

const QUESTION_START =
  /^(?:Q(?:uestion)?\s*\d*|第\s*\d+\s*题|\d+\s*[.)、])\s*[:：.\-]?\s*(.+)$/i;
const OPTION_START = /^([A-Ha-h])\s*[.)、:：]\s*(.+)$/;
const ANSWER_START = /^(?:Answer|答案)\s*[:：]\s*(.+)$/i;
const EXPLANATION_START = /^(?:Explanation|解析)\s*[:：]\s*(.+)$/i;

/** Parses the simple quiz format: Q:, A)–D), Answer:, optional Explanation:. */
export function parseQuizText(text: string): ParsedQuestion[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const out: ParsedQuestion[] = [];
  let current: { prompt: string; options: string[]; answer: string } | null = null;

  const flush = () => {
    if (!current || !current.prompt) return;
    const isSingle = current.options.length >= 2;
    let answer = current.answer.trim();
    if (isSingle) {
      const letter = answer.toUpperCase().match(/^[A-H]/)?.[0];
      const index = letter ? letter.charCodeAt(0) - 65 : current.options.findIndex((option) => option === answer);
      answer = String(index >= 0 ? index : -1);
    }
    out.push({
      kind: isSingle ? 'single' : 'short',
      prompt: current.prompt.trim(),
      options: current.options.map((option) => option.trim()).filter(Boolean),
      answer,
      points: 1,
    });
  };

  for (const line of lines) {
    const question = line.match(QUESTION_START);
    const option = line.match(OPTION_START);
    const answer = line.match(ANSWER_START);
    const explanation = line.match(EXPLANATION_START);
    if (explanation) continue;
    if (answer && current) {
      current.answer = answer[1] ?? '';
      continue;
    }
    if (option && current) {
      current.options.push(option[2] ?? '');
      continue;
    }
    if (question) {
      flush();
      current = { prompt: question[1] ?? '', options: [], answer: '' };
      continue;
    }
    if (current) {
      current.prompt += ` ${line}`;
    }
  }
  flush();
  return out.filter((question) => question.prompt.length > 0);
}

export function parseQuizDocx(buffer: Buffer): ParsedQuestion[] {
  return parseQuizText(extractDocxText(buffer));
}
