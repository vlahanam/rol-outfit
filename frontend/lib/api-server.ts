import type { Widget, Product, Tag, NewProductMetadata, NewProductSettings } from "@/types/api";
import { getLocale } from "next-intl/server";

const API_BASE = process.env.API_URL ? `${process.env.API_URL}/api/v1` : "http://backend:8080/api/v1";

const localeToLang: Record<string, string> = {
  vn: "vi",
  jp: "ja",
};

function getLangFromLocale(locale: string): string {
  return localeToLang[locale] ?? "vi";
}

interface FetchOptions {
  revalidate?: number;
  tags?: string[];
  locale?: string;
}

export async function fetchFromAPI<T>(
  path: string,
  options: FetchOptions = {}
): Promise<T | null> {
  const { revalidate = 60, tags, locale } = options;
  const currentLocale = locale ?? await getLocale();
  const lang = getLangFromLocale(currentLocale);

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { "Accept-Language": lang },
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

  const filtered = type ? widgets.filter((w) => w.type === type) : widgets;
  return filtered.sort((a, b) => a.display_order - b.display_order);
}

export async function fetchAllActiveWidgets(): Promise<Widget[]> {
  const widgets = await fetchWidgets();
  return widgets.filter((w) => w.status === 2);
}

export async function fetchProductsByTags(
  tagIds: string[],
  limit = 10,
  sort?: string
): Promise<Product[]> {
  if (tagIds.length === 0 && !sort) return [];

  const tags = await fetchFromAPI<Tag[]>("/tags?limit=100", { revalidate: 300 });
  if (!tags) return [];

  const slugs = tagIds
    .map((id) => tags.find((t) => t.id === id)?.slug)
    .filter(Boolean);

  let url = `/products?limit=${limit}`;
  if (slugs.length > 0) {
    url += `&tags=${slugs.join(",")}`;
  }
  if (sort) {
    url += `&sort=${sort}`;
  }

  const products = await fetchFromAPI<Product[]>(url, { revalidate: 60, tags: ["products"] });
  return products ?? [];
}

export async function fetchNewProductWidget(): Promise<{
  widget: Widget | null;
  products: Product[];
}> {
  const widgets = await fetchWidgets("new-product");
  const widget = widgets.find((w) => w.status === 2) ?? null;

  if (!widget) return { widget: null, products: [] };

  const meta = widget.metadata as NewProductMetadata | null;
  const settings = widget.settings as NewProductSettings | null;

  const tagIds = meta?.tag_ids ?? [];
  const limit = settings?.quantity ?? 10;

  const products = await fetchProductsByTags(tagIds, limit, "new_arrivals");

  return { widget, products };
}
