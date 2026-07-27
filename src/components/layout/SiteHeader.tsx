import Link from "next/link";
import { navItems, site } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-page/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
        <Link href="/" className="font-bold tracking-tight">
          {site.name}
        </Link>
        <nav aria-label="주요 메뉴">
          <ul className="flex gap-6 text-sm">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-muted hover:text-ink">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
