import { useSyncExternalStore } from "react";
import { getRoute, navigate, pathOf, subscribe } from "./router";

const useRoute = () => useSyncExternalStore(subscribe, getRoute, () => "/");

export function useRouter() {
  return {
    push: (href: string, o?: { scroll?: boolean }) => navigate(href, o),
    replace: (href: string) => navigate(href),
    prefetch: () => {},
    back: () => history.back(),
    forward: () => history.forward(),
    refresh: () => {},
  };
}
export function usePathname() {
  return pathOf(useRoute());
}
export function useSearchParams() {
  return new URLSearchParams(useRoute().split("?")[1] ?? "");
}
export function notFound(): never {
  throw new Error("not found");
}
