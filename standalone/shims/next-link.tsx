import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from "react";
import { navigate, toHash } from "./router";

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { href: string; children?: ReactNode; prefetch?: boolean; scroll?: boolean };

export default function Link({ href, children, onClick, prefetch: _p, scroll, ...rest }: Props) {
  const internal = href.startsWith("/");
  return (
    <a
      {...rest}
      href={internal ? "#" + toHash(href.replace(/#.*/, "")) : href}
      onClick={(e: MouseEvent<HTMLAnchorElement>) => {
        onClick?.(e);
        if (!internal || e.defaultPrevented || e.metaKey || e.ctrlKey) return;
        e.preventDefault();
        navigate(href, { scroll });
      }}
    >
      {children}
    </a>
  );
}
