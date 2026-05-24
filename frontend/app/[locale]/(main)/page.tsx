import { ProductItem } from "@/components/ProductItem";
import { TrendingCard } from "@/components/TrendingCard";
import { Footer } from "@/components/Footer";
import { BannerSlider } from "@/components/storefront/banner-slider";
import { CollectionSlider } from "@/components/storefront/collection-slider";
import { fetchWidgets } from "@/lib/api-server";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { BannerSliderMetadata, BannerSliderSettings, CollectionGridMetadata, CollectionGridSettings, CollectionItem } from "@/types/api";

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
                price="720.000₫"
                image="https://images.unsplash.com/photo-1599012307530-d163bd04ecab?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400"
                rating={4.5}
                isNew
              />
            </Link>
            <ProductItem
              name={t("officeSuit")}
              price="4.480.000₫"
              image="https://images.unsplash.com/photo-1687481795360-77c1115d26c6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400"
              rating={5.0}
              isNew
            />
            <ProductItem
              name={t("crewneck")}
              price="2.840.000₫"
              image="https://images.unsplash.com/photo-1732257119942-a19648e482f2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400"
              rating={4.8}
              isNew
            />
            <ProductItem
              name={t("leatherBag")}
              price="8.360.000₫"
              image="https://images.unsplash.com/photo-1721884258091-4fe7b737fb08?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400"
              rating={4.7}
              isNew
            />
            <ProductItem
              name={t("classicShoes")}
              price="1.780.000₫"
              image="https://images.unsplash.com/photo-1770226415002-dbbd40327ec7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400"
              rating={4.6}
              isNew
            />
            <ProductItem
              name={t("casualShirt")}
              price="1.040.000₫"
              image="https://images.unsplash.com/photo-1769981653696-5ce5a59263bf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400"
              rating={4.4}
              isNew
            />
            <ProductItem
              name={t("winterJacket")}
              price="3.720.000₫"
              image="https://images.unsplash.com/photo-1705675451868-014a161e591b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400"
              rating={4.9}
              isNew
            />
            <ProductItem
              name={t("sportsSneakers")}
              price="1.900.000₫"
              image="https://images.unsplash.com/photo-1721884258144-5d788061e4c4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400"
              rating={4.7}
              isNew
            />
            <ProductItem
              name={t("denim")}
              price="1.560.000₫"
              image="https://images.unsplash.com/photo-1627342229908-71efbac25f08?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400"
              rating={4.5}
              isNew
            />
            <ProductItem
              name={t("summerDress")}
              price="2.240.000₫"
              image="https://images.unsplash.com/photo-1732257119942-a19648e482f2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400"
              rating={4.8}
              isNew
            />
          </div>
        </section>

        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-gray-900">
              {t("hotTrends")}
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <TrendingCard
              title={t("autumnGradient")}
              image="https://images.unsplash.com/photo-1705675451868-014a161e591b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800"
            />
            <TrendingCard
              title={t("halloween")}
              image="https://images.unsplash.com/photo-1687481795360-77c1115d26c6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800"
            />
            <TrendingCard
              title={t("blueDenim")}
              image="https://images.unsplash.com/photo-1732257119942-a19648e482f2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800"
            />
            <TrendingCard
              title={t("officeDenim")}
              image="https://images.unsplash.com/photo-1769981653696-5ce5a59263bf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800"
            />
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
