import { BannerSlider } from "@/components/storefront/banner-slider";
import { CollectionSlider } from "@/components/storefront/collection-slider";
import { NewArrivalsGrid } from "@/components/storefront/new-arrivals-grid";
import { fetchAllActiveWidgets, fetchProductsByTags } from "@/lib/api-server";
import { getTranslations } from "next-intl/server";
import type {
  Widget,
  BannerSliderMetadata,
  BannerSliderSettings,
  CollectionGridMetadata,
  CollectionGridSettings,
  TrendHotMetadata,
  TrendHotSettings,
  NewProductMetadata,
  Product,
} from "@/types/api";

interface WidgetRenderData {
  widget: Widget;
  products?: Product[];
}

async function prepareWidgetData(widgets: Widget[]): Promise<WidgetRenderData[]> {
  const results: WidgetRenderData[] = [];

  for (const widget of widgets) {
    if (widget.type === "new-product") {
      const meta = widget.metadata as NewProductMetadata | null;
      const tagIds = meta?.tag_ids ?? [];
      const products = await fetchProductsByTags(tagIds, 10, "new_arrivals");
      results.push({ widget, products });
    } else {
      results.push({ widget });
    }
  }

  return results;
}

function renderWidget(data: WidgetRenderData, t: (key: string) => string) {
  const { widget, products } = data;

  switch (widget.type) {
    case "banner-slider": {
      const slides = ((widget.metadata as unknown as BannerSliderMetadata)?.slides ?? []);
      if (slides.length === 0) return null;
      const settings = widget.settings as BannerSliderSettings | null;
      const autoPlayInterval = settings?.autoPlayInterval ?? 5000;
      return (
        <section key={widget.id} className="mb-12">
          <BannerSlider slides={slides} autoPlayInterval={autoPlayInterval} />
        </section>
      );
    }

    case "collection-grid": {
      const items = ((widget.metadata as unknown as CollectionGridMetadata)?.items ?? []);
      if (items.length === 0) return null;
      const settings = widget.settings as CollectionGridSettings | null;
      const cardHeight = settings?.cardHeight ?? 400;
      return (
        <CollectionSlider
          key={widget.id}
          items={items}
          title={widget.name ?? t("specialCollections")}
          cardHeight={cardHeight}
        />
      );
    }

    case "trend-hot": {
      const items = ((widget.metadata as unknown as TrendHotMetadata)?.items ?? []);
      if (items.length === 0) return null;
      const settings = widget.settings as TrendHotSettings | null;
      const cardHeight = settings?.cardHeight ?? 400;
      return (
        <CollectionSlider
          key={widget.id}
          items={items}
          title={widget.name ?? t("hotTrends")}
          cardHeight={cardHeight}
        />
      );
    }

    case "new-product": {
      if (!products || products.length === 0) return null;
      return (
        <NewArrivalsGrid
          key={widget.id}
          title={widget.name ?? t("newArrivals")}
          products={products}
        />
      );
    }

    default:
      return null;
  }
}

export default async function HomePage() {
  const t = await getTranslations("HomePage");
  const widgets = await fetchAllActiveWidgets();
  const widgetData = await prepareWidgetData(widgets);

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      {widgetData.map((data) => renderWidget(data, t))}
    </main>
  );
}
