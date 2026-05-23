import type { Widget } from "@/types/api";

const API_BASE = process.env.API_URL ? `${process.env.API_URL}/api/v1` : "http://backend:8080/api/v1";

interface FetchOptions {
  revalidate?: number;
  tags?: string[];
}

export async function fetchFromAPI<T>(
  path: string,
  options: FetchOptions = {}
): Promise<T | null> {
  const { revalidate = 60, tags } = options;

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      next: { revalidate, tags },
    });

    if (!res.ok) return null;

    const json = await res.json();
    return json.data ?? null;
  } catch {
    return null;
  }
}

export async function fetchWidgets(type?: string): Promise<Widget[]> {
  const path = "/widgets?limit=50";
  const widgets = await fetchFromAPI<Widget[]>(path, {
    revalidate: 60,
    tags: ["widgets"],
  });

  if (!widgets) return [];

  return type ? widgets.filter((w) => w.type === type) : widgets;
}
