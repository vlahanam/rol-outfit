import { ProductItem } from "@/components/ProductItem";
import { BannerSlider } from "@/components/storefront/banner-slider";
import { CollectionSlider } from "@/components/storefront/collection-slider";
import { fetchWidgets, fetchNewProductWidget } from "@/lib/api-server";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { BannerSliderMetadata, BannerSliderSettings, CollectionGridMetadata, CollectionGridSettings, CollectionItem, TrendHotMetadata, TrendHotSettings, NewProductSettings } from "@/types/api";

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
  const newProductSettings = newProductWidget?.settings as NewProductSettings | null;
  const newProductColumns = newProductSettings?.columns ?? 5;

  const getGridClass = (cols: number) => {
    const map: Record<number, string> = {
      2: "grid-cols-2",
      3: "grid-cols-2 sm:grid-cols-3",
      4: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4",
      5: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5",
    };
    return map[cols] ?? map[5];
  };

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

        {newProducts.length > 0 ? (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-gray-900">
                {newProductWidget?.name ?? t("newArrivals")}
              </h2>
              <div className="flex gap-2">
                <button className="p-2 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button className="p-2 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className={`grid gap-6 ${getGridClass(newProductColumns)}`}>
              {newProducts.map((p) => (
                <Link key={p.id} href={`/product/${p.slug}`}>
                  <ProductItem
                    name={p.name}
                    price={`${p.sale_price.toLocaleString()}d`}
                    originalPrice={p.discount_percent > 0 ? `${p.default_price.toLocaleString()}d` : undefined}
                    discountPercent={p.discount_percent > 0 ? p.discount_percent : undefined}
                    image={p.avatar || "/placeholder-product.svg"}
                    tags={p.tags}
                    maxTags={2}
                  />
                </Link>
              ))}
            </div>
          </section>
        ) : (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-gray-900">
                {t("newArrivals")}
              </h2>
              <div className="flex gap-2">
                <button className="p-2 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button className="p-2 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              <Link href="/product/1" className="cursor-pointer">
                <ProductItem
                  name={t("cottonLogo")}
                  price="720.000d"
                  rating={4.5}
                />
              </Link>
              <ProductItem
                name={t("officeSuit")}
                price="4.480.000d"
                rating={5.0}
              />
              <ProductItem
                name={t("crewneck")}
                price="2.840.000d"
                rating={4.8}
              />
              <ProductItem
                name={t("leatherBag")}
                price="8.360.000d"
                rating={4.7}
              />
              <ProductItem
                name={t("classicShoes")}
                price="1.780.000d"
                rating={4.6}
              />
              <ProductItem
                name={t("casualShirt")}
                price="1.040.000d"
                rating={4.4}
              />
              <ProductItem
                name={t("winterJacket")}
                price="3.720.000d"
                rating={4.9}
              />
              <ProductItem
                name={t("sportsSneakers")}
                price="1.900.000d"
                rating={4.7}
              />
              <ProductItem
                name={t("denim")}
                price="1.560.000d"
                rating={4.5}
              />
              <ProductItem
                name={t("summerDress")}
                price="2.240.000d"
                rating={4.8}
              />
            </div>
          </section>
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
