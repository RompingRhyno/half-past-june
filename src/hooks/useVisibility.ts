import { useRef, useState, useEffect, MutableRefObject } from "react";

/**
 * useVisibility
 * Tracks whether an element is visible in the viewport.
 * Supports dynamic updates (e.g., elements added via infinite scroll).
 */
export function useVisibility<T extends HTMLElement>(
  rootMargin = "200px"
) {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          // Optional: keep observing for dynamic elements
          // observer.disconnect(); // <-- remove if we want to keep observing
        }
      },
      { rootMargin }
    );

    observer.observe(el);

    return () => observer.disconnect();
  }, [rootMargin, ref.current]); // ref.current ensures new elements are observed

  return [ref, visible] as const;
}
