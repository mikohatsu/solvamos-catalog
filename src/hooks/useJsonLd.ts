import { useEffect } from 'react';

/** Inject / replace a single application/ld+json script in <head>. */
export function useJsonLd(id: string, data: unknown | null) {
  const json = data == null ? null : JSON.stringify(data);
  useEffect(() => {
    if (!json) {
      document.getElementById(id)?.remove();
      return;
    }
    let el = document.getElementById(id) as HTMLScriptElement | null;
    if (!el) {
      el = document.createElement('script');
      el.id = id;
      el.type = 'application/ld+json';
      document.head.appendChild(el);
    }
    el.textContent = json;
    return () => {
      document.getElementById(id)?.remove();
    };
  }, [id, json]);
}

type HeadLink = { id: string; rel: string; type?: string; href: string };

/** Upsert <link> tags in <head> (e.g. rel=agent-card). */
export function useHeadLinks(links: HeadLink[]) {
  const key = JSON.stringify(links);
  useEffect(() => {
    const parsed = JSON.parse(key) as HeadLink[];
    const ids = parsed.map((l) => l.id);
    for (const link of parsed) {
      if (!link.href) continue;
      let el = document.getElementById(link.id) as HTMLLinkElement | null;
      if (!el) {
        el = document.createElement('link');
        el.id = link.id;
        document.head.appendChild(el);
      }
      el.rel = link.rel;
      if (link.type) el.type = link.type;
      else el.removeAttribute('type');
      el.href = link.href;
    }
    return () => {
      for (const id of ids) document.getElementById(id)?.remove();
    };
  }, [key]);
}
