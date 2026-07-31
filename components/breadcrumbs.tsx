import Link from "next/link";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="breadcrumb" aria-label="パンくず">
      <ol>
        {items.map((item, index) => {
          const isCurrent = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="breadcrumb-item">
              {isCurrent || !item.href ? (
                <span className="breadcrumb-current">{item.label}</span>
              ) : (
                <Link href={item.href} className="breadcrumb-link">
                  {item.label}
                </Link>
              )}
              {!isCurrent ? <span className="breadcrumb-separator" aria-hidden="true">&gt;</span> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
