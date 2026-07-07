"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { ShoppingCart, Minus, Plus, ArrowLeft, MessageCircle } from "lucide-react";
import { ImageGallery } from "@/components/product/image-gallery";
import { TagBadges } from "@/components/product/tag-badges";
import { DiscountCountdown } from "@/components/product/discount-countdown";
import { VariantPicker } from "@/components/product/variant-picker";
import { RelatedProductsSection } from "@/components/product/related-products-section";
import { ReviewsSection } from "@/components/product/reviews-section";
import { adminSettings } from "@/lib/api-resources";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { api, ApiError } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";
import { useCart } from "@/context/cart-context";
import { useFlyToCart } from "@/hooks/use-fly-to-cart";
import type { ApiResponse, Product, ProductVariant, SizeGuideEntry, DeliveryInfoEntry } from "@/types/api";
import { formatPrice } from "@/lib/format";

const DEFAULT_SIZE_GUIDE: SizeGuideEntry[] = [
  { size: "M", height: "1m60 - 1m68", weight: "50 - 60kg" },
  { size: "L", height: "1m68 - 1m75", weight: "60 - 70kg" },
  { size: "XL", height: "1m75 - 1m82", weight: "70 - 80kg" },
];

const DEFAULT_DELIVERY_INFO_VN: DeliveryInfoEntry[] = [
  { region: "Nhật Bản", time: "2-5 ngày" },
  { region: "Việt Nam", time: "2-7 ngày" },
];

const DEFAULT_DELIVERY_INFO_JP: DeliveryInfoEntry[] = [
  { region: "日本", time: "2〜5日" },
  { region: "ベトナム", time: "2〜7日" },
];

function buildImages(p: Product | null, vs: ProductVariant[]): string[] {
  const out = new Set<string>();
  if (p?.avatar) out.add(p.avatar);
  for (const v of vs) if (v.avatar) out.add(v.avatar);
  return [...out];
}

function resolveVariant(
  vs: ProductVariant[],
  sel: Record<string, string>,
): ProductVariant | null {
  if (Object.values(sel).some((v) => !v)) return null;
  return (
    vs.find((v) =>
      Object.entries(sel).every(([k, val]) => v.attributes[k] === val),
    ) ?? null
  );
}

function SizeGuideSection({
  entries,
  t,
}: {
  entries: SizeGuideEntry[];
  t: (key: string) => string;
}) {
  if (!entries.length) return null;
  return (
    <div className="mt-6 border-t border-gray-200 pt-6">
      <h3 className="font-semibold mb-3">{t("sizeGuide")}</h3>
      <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left font-semibold text-gray-700 border-b border-gray-200">
              {t("size")}
            </th>
            <th className="px-4 py-2 text-left font-semibold text-gray-700 border-b border-gray-200">
              {t("height")}
            </th>
            <th className="px-4 py-2 text-left font-semibold text-gray-700 border-b border-gray-200">
              {t("weight")}
            </th>
          </tr>
        </thead>
        <tbody className="text-gray-600">
          {entries.map((entry, idx) => (
            <tr
              key={entry.size}
              className={idx < entries.length - 1 ? "border-b border-gray-100" : ""}
            >
              <td className="px-4 py-2 font-medium">{entry.size}</td>
              <td className="px-4 py-2">{entry.height}</td>
              <td className="px-4 py-2">{entry.weight}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DeliveryInfoSection({
  entries,
  t,
}: {
  entries: DeliveryInfoEntry[];
  t: (key: string) => string;
}) {
  if (!entries.length) return null;
  return (
    <div className="mt-6 border-t border-gray-200 pt-6">
      <h3 className="font-semibold mb-3">{t("deliveryTime")}</h3>
      <ul className="space-y-2 text-sm text-gray-600">
        {entries.map((entry) => (
          <li key={entry.region} className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
            {entry.region}: {entry.time}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("ProductDetailPage");
  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [imageIdx, setImageIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [chatUrl, setChatUrl] = useState<string | null>(null);
  const { incrementCart } = useCart();
  const { trigger: flyToCart } = useFlyToCart();

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api.get<ApiResponse<Product>>(`/products/${id}`, locale),
      api.get<ApiResponse<ProductVariant[]>>(`/products/${id}/variants`, locale),
    ])
      .then(([pr, vr]) => {
        setProduct(pr.data);
        setVariants(vr.data ?? []);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [id, locale]);

  useEffect(() => {
    adminSettings
      .getChatUrl()
      .then((res) => setChatUrl(res.data?.chat_url || null))
      .catch(() => setChatUrl(null));
  }, []);

  const images = useMemo(
    () => buildImages(product, variants),
    [product, variants],
  );
  const totalStock = useMemo(
    () => variants.reduce((s, v) => s + (v.stock ?? 0), 0),
    [variants],
  );
  const totalSold = useMemo(
    () => variants.reduce((s, v) => s + (v.sold ?? 0), 0),
    [variants],
  );

  const hasVariants = variants.length > 0;
  const axisCount = product?.attribute_names?.length ?? 0;
  const allPicked =
    hasVariants &&
    Object.keys(selected).length === axisCount &&
    Object.values(selected).every(Boolean);
  const variant = allPicked ? resolveVariant(variants, selected) : null;

  const price = variant?.price ?? product?.default_price ?? 0;
  const salePrice = variant?.sale_price ?? product?.sale_price ?? price;
  const isDiscounted = salePrice < price;
  const stock = variant?.stock ?? null;
  const outOfStock = variant !== null && stock !== null && stock <= 0;
  const needsPick = hasVariants && !allPicked;
  const cartDisabled = addingToCart || needsPick || outOfStock;

  // stock display: variant stock when selected, total stock otherwise
  const stockValue = variant !== null ? variant.stock : totalStock;
  const stockEmpty = stockValue <= 0;
  const stockText = stockEmpty ? t("outOfStock") : t("inStock", { count: stockValue });

  // jump gallery to selected variant's image
  useEffect(() => {
    if (variant?.avatar) {
      const idx = images.indexOf(variant.avatar);
      if (idx >= 0) setImageIdx(idx);
    }
  }, [variant, images]);

  const handleAddToCart = async () => {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }
    if (!product) return;
    if (needsPick) {
      toast.warning(t("pleaseSelectVariant"));
      return;
    }
    setAddingToCart(true);
    try {
      await api.post("/cart/items", {
        product_id: product.id,
        ...(variant ? { attr_id: variant.id } : {}),
        quantity,
      });
      incrementCart(quantity);
      flyToCart(images[imageIdx] ?? product.avatar ?? "");
      toast.success(t("addedToCart"));
    } catch {
      toast.error(t("addToCartFailed"));
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-500">{t("loading")}</p>
      </div>
    );
  }
  if (notFound || !product) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-gray-600">{t("notFound")}</p>
        <Link href="/shop" className="text-blue-600 hover:underline">
          {t("backToShop")}
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white flex flex-col">
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-8">
        <Link
          href="/shop"
          className="flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>{t("back")}</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <ImageGallery
            images={images}
            activeIndex={imageIdx}
            onSelect={setImageIdx}
            alt={product.name}
          />

          <div>
            <TagBadges tags={product.tags ?? []} />
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              {product.name}
            </h1>
            <div className="mb-4">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-3xl font-bold text-blue-600">
                  {formatPrice(salePrice, product.product_type)}
                </span>
                {isDiscounted && !isExpired && (
                  <>
                    <span className="text-xl text-gray-400 line-through">
                      {formatPrice(price, product.product_type)}
                    </span>
                    <span className="px-2 py-0.5 bg-red-100 text-red-600 text-sm font-semibold rounded">
                      -{Math.round((1 - salePrice / price) * 100)}%
                    </span>
                    <DiscountCountdown
                      key={variant?.discount_end_at ?? product?.discount_end_at ?? "no-end"}
                      discountEndAt={variant?.discount_end_at ?? product?.discount_end_at}
                      onExpire={() => setIsExpired(true)}
                    />
                  </>
                )}
                {isExpired && (
                  <span className="text-sm text-orange-500 font-medium">
                    {t("discountExpired")}
                  </span>
                )}
              </div>
              {hasVariants && (
                <div className="flex items-center gap-3 mt-1">
                  <p className={`text-sm ${!stockEmpty ? "text-gray-500" : "text-red-500"}`}>
                    {stockText}
                  </p>
                  {totalSold > 0 && (
                    <p className="text-sm text-gray-400">
                      {t("sold", { count: totalSold })}
                    </p>
                  )}
                </div>
              )}
            </div>

            {hasVariants && (
              <div className="mb-6">
                <VariantPicker
                  attributeNames={product.attribute_names ?? []}
                  variants={variants}
                  selected={selected}
                  onChange={setSelected}
                />
              </div>
            )}

            <div className="mb-6">
              <h3 className="font-semibold mb-3">{t("quantity")}</h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center font-semibold">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm font-semibold text-blue-700 mt-2">
                {t("total")}: {formatPrice(salePrice * quantity, product.product_type)}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleAddToCart}
                disabled={cartDisabled}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="w-5 h-5" />
                {outOfStock
                  ? t("outOfStock")
                  : needsPick
                    ? t("selectVariant")
                    : addingToCart
                      ? t("adding")
                      : t("addToCart")}
              </button>
              {chatUrl && (
                <a
                  href={chatUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 border-2 border-green-500 text-green-600 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  {t("messageNow")}
                </a>
              )}
            </div>

            <SizeGuideSection
              entries={product.size_guide ?? DEFAULT_SIZE_GUIDE}
              t={t}
            />

            <DeliveryInfoSection
              entries={product.delivery_info ?? (locale === "jp" ? DEFAULT_DELIVERY_INFO_JP : DEFAULT_DELIVERY_INFO_VN)}
              t={t}
            />
          </div>
        </div>

        {product.description && (
          <div className="border-t border-gray-200 pt-8 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              {t("description")}
            </h2>
            <div
              className="prose prose-sm max-w-none text-gray-600"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          </div>
        )}

        <ReviewsSection productId={product.id} />

        {product.category_id && (
          <RelatedProductsSection
            categoryId={product.category_id}
            excludeProductId={product.id}
          />
        )}
      </div>
    </div>
  );
}
