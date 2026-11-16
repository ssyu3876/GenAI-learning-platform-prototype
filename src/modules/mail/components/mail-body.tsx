// Mail is plain text, but links should still be usable. Render absolute URLs and the
// platform's relative course paths as anchors without interpreting arbitrary HTML.
import Link from 'next/link';

const LINK_RE = /(https?:\/\/[^\s]+|\/courses\/[A-Za-z0-9._~!$&'()*+,;=:@%/-]+)/g;
const TRAILING = /[.,;:!?)\]}"'。，；：！？）】》]+$/;

export function MailBody({ body }: { body: string }) {
  const parts = body.split(LINK_RE);
  return (
    <div className="whitespace-pre-wrap text-[15px] leading-relaxed">
      {parts.map((part, index) => {
        if (!/^(https?:\/\/|\/courses\/)/.test(part)) return <span key={index}>{part}</span>;
        const match = part.match(TRAILING);
        const suffix = match?.[0] ?? '';
        const href = suffix ? part.slice(0, -suffix.length) : part;
        if (!href) return <span key={index}>{part}</span>;
        const external = /^https?:\/\//.test(href);
        return (
          <span key={index}>
            {external ? (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-coral-deep underline underline-offset-2"
              >
                {href}
              </a>
            ) : (
              <Link href={href} className="font-semibold text-coral-deep underline underline-offset-2">
                {href}
              </Link>
            )}
            {suffix}
          </span>
        );
      })}
    </div>
  );
}
