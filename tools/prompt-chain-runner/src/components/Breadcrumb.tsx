import Link from "next/link";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface Props {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: Props) {
  return (
    <nav className="flex items-center gap-2 text-sm text-gray-500">
      {items.map((item, idx) => (
        <span key={idx} className="flex items-center gap-2">
          {idx > 0 && <span className="text-gray-300">›</span>}
          {item.href ? (
            <Link href={item.href} className="hover:text-gray-900 transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-900 font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
