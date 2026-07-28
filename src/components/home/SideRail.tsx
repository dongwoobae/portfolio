import Image from "next/image";
import Link from "next/link";
import { CopyEmail } from "@/components/contact/CopyEmail";
import { RailNav } from "@/components/home/RailNav";
import { stackLines } from "@/content/home";
import { site } from "@/lib/site";

function ContactRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <span className="flex items-baseline gap-2.5">
      <span className="w-10 flex-none font-mono text-[10.5px] text-faint">
        {label}
      </span>
      {children}
    </span>
  );
}

export function SideRail() {
  return (
    <div className="flex flex-col gap-8 border-b border-line bg-rail px-8 py-9 lg:sticky lg:top-0 lg:h-screen lg:w-[300px] lg:flex-none lg:overflow-auto lg:border-r lg:border-b-0 lg:py-11">
      <div>
        <p className="mb-[18px] font-mono text-xs text-accent">~/dongwoobae</p>
        <Image
          src="/photo/dongwoo_photo.jpg"
          alt="배동우 프로필 사진"
          width={84}
          height={84}
          priority
          className="mb-[18px] h-21 w-21 rounded-lg border border-line object-cover object-top"
        />
        <h1 className="text-[25px] font-bold">{site.name}</h1>
        <p className="mt-1.5 font-mono text-[11.5px] text-tertiary">
          backend-driven fullstack
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <p className="font-mono text-[11px] text-faint">$ cat contact.txt</p>
        <div className="flex flex-col gap-2.5 text-[13px]">
          <ContactRow label="mail">
            <CopyEmail />
          </ContactRow>
          <ContactRow label="github">
            <a href={site.github} className="text-muted">
              {site.githubLabel}
            </a>
          </ContactRow>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <p className="font-mono text-[11px] text-faint">$ cat stack.txt</p>
        <div className="flex flex-col gap-2 text-[12.5px] text-muted">
          {stackLines.map((line) => (
            <span key={line.label}>
              <span className="font-medium text-ink">{line.label}</span> —{" "}
              {line.value}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3.5 lg:mt-auto">
        <Link
          href="/resume"
          className="font-mono text-[11.5px] text-accent hover:underline"
        >
          $ open resume
        </Link>
        <RailNav />
        <span className="font-mono text-[11px] text-ghost">
          © 2026 Dongwoo Bae
        </span>
      </div>
    </div>
  );
}
