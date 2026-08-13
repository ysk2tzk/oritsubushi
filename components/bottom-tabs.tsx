"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "地図を見る" },
  { href: "/record", label: "記録する" },
  { href: "/history", label: "記録を見る" }
];

export function BottomTabs({ activeHref }: { activeHref?: string }) {
  const pathname = usePathname();

  return (
    <div className="bottom-tabs">
      <nav aria-label="下部タブ">
        {tabs.map((tab) => {
          const active = activeHref
            ? tab.href === activeHref
            : tab.href === "/"
              ? pathname === "/"
              : pathname === tab.href || pathname.startsWith(`${tab.href}/`);

          return (
            <Link key={tab.href} className={`tab-link${active ? " active" : ""}`} href={tab.href}>
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
