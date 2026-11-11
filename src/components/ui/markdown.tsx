import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from './cn';
import { parseVideoUrl, type VideoEmbed } from './video-embed';

// Minimal shape of the hast nodes react-markdown hands to components (avoids a direct
// dependency on the hast types).
interface HastNode {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
}

function textOf(node: HastNode): string {
  if (node.type === 'text') return node.value ?? '';
  return (node.children ?? []).map(textOf).join('');
}

/** A paragraph that holds nothing but one YouTube / Bilibili link → that video, else null. */
function videoInParagraph(node: unknown): { video: VideoEmbed; href: string; label: string } | null {
  const children = ((node as HastNode | undefined)?.children ?? []).filter(
    (c) => !(c.type === 'text' && !(c.value ?? '').trim()),
  );
  const only = children.length === 1 ? children[0] : undefined;
  if (!only || only.type !== 'element' || only.tagName !== 'a') return null;
  const href = String(only.properties?.href ?? '');
  const video = parseVideoUrl(href);
  if (!video) return null;
  return { video, href, label: textOf(only).trim() || href };
}

function VideoFrame({ video, href, label }: { video: VideoEmbed; href: string; label: string }) {
  return (
    <figure>
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border-2 border-line bg-ink shadow-sticker-sm">
        <iframe
          src={video.embedUrl}
          title={label}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
      <figcaption className="mt-2 text-sm text-ink-soft">
        <a href={href} target="_blank" rel="noopener noreferrer">
          {label}
        </a>
      </figcaption>
    </figure>
  );
}

// A YouTube or Bilibili link on a line of its own becomes an embedded player; the link text
// is the caption. Any other link, or a video link inside a sentence, stays a normal link.
const videoComponents: Components = {
  p({ node, children, ...rest }) {
    const found = videoInParagraph(node);
    if (found) return <VideoFrame {...found} />;
    return <p {...rest}>{children}</p>;
  },
};

/**
 * Renders lesson / AI markdown. Raw HTML is not rendered (safe for AI output).
 * `videos`: embed YouTube / Bilibili links that stand alone on a line. Only for content an
 * author wrote (lessons), never for AI chat output.
 */
export function Markdown({ children, className, videos = false }: { children: string; className?: string; videos?: boolean }) {
  return (
    <div className={cn('prose-sprout', className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={videos ? videoComponents : undefined}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
