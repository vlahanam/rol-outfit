import { BannerSlider } from "@/components/storefront/banner-slider";
import { CollectionSlider } from "@/components/storefront/collection-slider";
import { NewArrivalsGrid } from "@/components/storefront/new-arrivals-grid";
import { fetchWidgets, fetchNewProductWidget } from "@/lib/api-server";
import { getTranslations } from "next-intl/server";
import type { BannerSliderMetadata, BannerSliderSettings, CollectionGridMetadata, CollectionGridSettings, CollectionItem, TrendHotMetadata, TrendHotSettings } from "@/types/api";

export default async function HomePage() {
  const t = await getTranslations("HomePage");

  const widgets = await fetchWidgets("banner-slider");
  const bannerWidget = widgets[0];
  const slides = bannerWidget
    ? ((bannerWidget.metadata as unknown as BannerSliderMetadata)?.slides ?? [])
    : [];
  const bannerSettings = bannerWidget?.settings as BannerSliderSettings | null;
  const autoPlayInterval = bannerSettings?.autoPlayInterval ?? 5000;

  const collectionWidgets = await fetchWidgets("collection-grid");
  const collectionWidget = collectionWidgets[0];
  const collectionItems: CollectionItem[] = collectionWidget
    ? ((collectionWidget.metadata as unknown as CollectionGridMetadata)?.items ?? [])
    : [];
  const collectionSettings = collectionWidget?.settings as CollectionGridSettings | null;
  const cardHeight = collectionSettings?.cardHeight ?? 400;

  const trendHotWidgets = await fetchWidgets("trend-hot");
  const trendHotWidget = trendHotWidgets[0];
  const trendHotItems: CollectionItem[] = trendHotWidget
    ? ((trendHotWidget.metadata as unknown as TrendHotMetadata)?.items ?? [])
    : [];
  const trendHotSettings = trendHotWidget?.settings as TrendHotSettings | null;
  const trendHotCardHeight = trendHotSettings?.cardHeight ?? 400;

  const { widget: newProductWidget, products: newProducts } = await fetchNewProductWidget();

  return (
    <>
      <main className="max-w-7xl mx-auto px-4 py-8">
        {slides.length > 0 && (
          <section className="mb-12">
            <BannerSlider slides={slides} autoPlayInterval={autoPlayInterval} />
          </section>
        )}

        {collectionItems.length > 0 && (
          <CollectionSlider
            items={collectionItems}
            title={collectionWidget?.name ?? t("specialCollections")}
            cardHeight={cardHeight}
          />
        )}

        {newProducts.length > 0 && (
          <NewArrivalsGrid
            title={newProductWidget?.name ?? t("newArrivals")}
            products={newProducts}
          />
        )}

        {trendHotItems.length > 0 && (
          <CollectionSlider
            items={trendHotItems}
            title={trendHotWidget?.name ?? t("hotTrends")}
            cardHeight={trendHotCardHeight}
          />
        )}
      </main>
    </>
  );
}
