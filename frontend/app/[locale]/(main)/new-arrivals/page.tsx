"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { ProductItem } from "@/components/ProductItem";
import { Footer } from "@/components/Footer";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";

export default function NewArrivalsPage() {
  const t = useTranslations("NewArrivalsPage");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const [sortBy, setSortBy] = useState("newest");

  const newProducts = [
    {
      nameKey: "cottonLogo",
      price: "720.000₫",
      image:
        "https://images.unsplash.com/photo-1599012307530-d163bd04ecab?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    },
    {
      nameKey: "officeSuit",
      price: "4.480.000₫",
      image:
        "https://images.unsplash.com/photo-1687481795360-77c1115d26c6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    },
    {
      nameKey: "casualShirt",
      price: "1.040.000₫",
      image:
        "https://images.unsplash.com/photo-1769981653696-5ce5a59263bf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    },
    {
      nameKey: "winterJacket",
      price: "3.720.000₫",
      image:
        "https://images.unsplash.com/photo-1705675451868-014a161e591b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    },
    {
      nameKey: "sportsSneakers",
      price: "1.900.000₫",
      image:
        "https://images.unsplash.com/photo-1721884258144-5d788061e4c4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    },
    {
      nameKey: "kakiSlim",
      price: "890.000₫",
      image:
        "https://images.unsplash.com/photo-1599012307530-d163bd04ecab?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    },
    {
      nameKey: "poloPremium",
      price: "650.000₫",
      image:
        "https://images.unsplash.com/photo-1732257119942-a19648e482f2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    },
    {
      nameKey: "sportShorts",
      price: "450.000₫",
      image:
        "https://images.unsplash.com/photo-1627342229908-71efbac25f08?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    },
    {
      nameKey: "hoodie",
      price: "1.200.000₫",
      image:
        "https://images.unsplash.com/photo-1705675451868-014a161e591b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    },
    {
      nameKey: "sneakerLimited",
      price: "2.400.000₫",
      image:
        "https://images.unsplash.com/photo-1770226415002-dbbd40327ec7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Link
          href="/"
          className="flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>{tCommon("backToHome")}</span>
        </Link>

        <div className="mb-8">
          <div className="inline-block bg-blue-100 text-blue-600 text-xs px-3 py-1 rounded-full mb-3">
            {t("badge")}
          </div>
          <h1 className="text-3xl font-bold mb-2">{t("title")}</h1>
          <p className="text-gray-600">{t("subtitle")}</p>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <p className="text-gray-600">
              {t("showing")}{" "}
              <span className="font-semibold">{newProducts.length}</span>{" "}
              {t("newProducts")}
            </p>
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="newest">{t("sortNewest")}</option>
            <option value="price-low">{t("sortPriceLow")}</option>
            <option value="price-high">{t("sortPriceHigh")}</option>
          </select>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {newProducts.map((product, idx) => (
            <div
              key={idx}
              onClick={() => router.push("/product/1")}
              className="cursor-pointer"
            >
              <ProductItem
                name={t(product.nameKey)}
                price={product.price}
                image={product.image}
                isNew
              />
            </div>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}
