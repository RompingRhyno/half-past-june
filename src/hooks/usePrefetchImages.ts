import { useEffect, useRef } from "react";
import { prefetchScheduler } from "@/lib/prefetchScheduler";

export function usePrefetchImages<T>(
  items: T[],
  resolveSrc: (item: T) => string,
  options?: {
    staggerMs?: number;
    rootMargin?: string;
  }
) {
  const ref = useRef<HTMLDivElement>(null);
  const prefetched = useRef<Set<string>>(new Set());

  useEffect(() => {
    const el = ref.current;
    if (!el || !items.length) return;

    const observer = new IntersectionObserver(
      entries => {
        if (!entries[0].isIntersecting) return;

        items.forEach((item, i) => {
          const src = resolveSrc(item);
          if (!prefetched.current.has(src)) {
            prefetched.current.add(src);
            setTimeout(() => prefetchScheduler.enqueue(src), i * (options?.staggerMs ?? 200));
          }
        });
      },
      { rootMargin: options?.rootMargin ?? "200px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [items, resolveSrc, options?.rootMargin, options?.staggerMs]);

  return ref;
}
