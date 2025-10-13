import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

type PageBreadcrumbsProps = {
  items: PageBreadcrumb[];
  className?: string;
};

type BreadcrumbTarget = {
  to: string;
  params?: Record<string, string>;
  search?: Record<string, unknown>;
};

export type PageBreadcrumb = {
  label: string;
  to?: BreadcrumbTarget;
  icon?: ReactNode;
};

export function PageBreadcrumbs({ items, className }: PageBreadcrumbsProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const content = (
            <span className="flex items-center gap-2">
              {item.icon ? <span aria-hidden>{item.icon}</span> : null}
              <span>{item.label}</span>
            </span>
          );
          return (
            <BreadcrumbItem key={`${item.label}-${index}`} className="flex items-center gap-1">
              {item.to && !isLast ? (
                <BreadcrumbLink asChild>
                  <Link to={item.to.to} params={item.to.params} search={item.to.search}>
                    {content}
                  </Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{content}</BreadcrumbPage>
              )}
              {!isLast ? <BreadcrumbSeparator /> : null}
            </BreadcrumbItem>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export const baseAppBreadcrumb: PageBreadcrumb = {
  label: "Memoria",
  to: { to: "/projects" },
  icon: (
    <span className="flex size-6 items-center justify-center rounded-full bg-primary text-[10px] font-semibold uppercase text-primary-foreground">
      M
    </span>
  ),
};
