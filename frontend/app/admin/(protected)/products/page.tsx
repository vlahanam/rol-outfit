"use client";

import { useState, useEffect, Fragment } from "react";
import {
  Plus,
  Search,
  ChevronDown,
  ChevronRight,
  Edit,
  Trash2,
  ImageIcon,
  Copy,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { DeleteConfirmModal } from "@/components/admin/DeleteConfirmModal";
import { ProductListVariantsTable } from "@/components/admin/product-list-variants-table";
import { api } from "@/lib/api";
import type { ApiResponse, AdminProduct, Category } from "@/types/api";

function stockBadge(stock: number): { label: string; cls: string } {
  if (stock === 0) return { label: "Hết hàng", cls: "bg-red-100 text-red-700" };
  if (stock <= 20)
    return { label: "Sắp hết", cls: "bg-yellow-100 text-yellow-700" };
  return { label: "Còn hàng", cls: "bg-green-100 text-green-700" };
}

function copyToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text: string) {
  const el = document.createElement("input");
  el.value = text;
  document.body.appendChild(el);
  el.select();
  document.execCommand("copy");
  document.body.removeChild(el);
}

export default function ListProductPage() {
  const router = useRouter();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [stockFilter, setStockFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteVariant, setDeleteVariant] = useState<{
    productId: string;
    variantId: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          api.adminProducts.list({ limit: 100 }),
          api.get<ApiResponse<Category[]>>("/categories?limit=50"),
        ]);
        setProducts(prodRes.data ?? []);
        setCategories(catRes.data ?? []);
      } catch {
        // keep empty on error
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const categoryName = (id: string) =>
    categories.find((c) => c.id === id)?.name ?? "—";

  const filtered = products
    .filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchCategory = categoryFilter === "" || p.category_id === categoryFilter;
      const matchStock =
        stockFilter === "" ||
        (stockFilter === "in-stock" && p.total_stock > 20) ||
        (stockFilter === "low-stock" && p.total_stock > 0 && p.total_stock <= 20) ||
        (stockFilter === "out-of-stock" && p.total_stock === 0);
      const matchStatus =
        statusFilter === "" ||
        (statusFilter === "active" && p.status === 1) ||
        (statusFilter === "hidden" && p.status === 2);
      const matchPriceMin = priceMin === "" || p.default_price >= Number(priceMin);
      const matchPriceMax = priceMax === "" || p.default_price <= Number(priceMax);
      return matchSearch && matchCategory && matchStock && matchStatus && matchPriceMin && matchPriceMax;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name-asc": return a.name.localeCompare(b.name);
        case "name-desc": return b.name.localeCompare(a.name);
        case "price-asc": return a.default_price - b.default_price;
        case "price-desc": return b.default_price - a.default_price;
        case "stock-asc": return a.total_stock - b.total_stock;
        case "stock-desc": return b.total_stock - a.total_stock;
        case "oldest": return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        default: return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/products/${deleteId}`);
      setProducts((prev) => prev.filter((p) => p.id !== deleteId));
    } catch {
      // ignore
    } finally {
      setDeleteId(null);
    }
  };

  const handleDeleteVariant = async () => {
    if (!deleteVariant) return;
    const { productId, variantId } = deleteVariant;
    try {
      await api.delete(`/products/${productId}/variants/${variantId}`);
      setProducts((prev) =>
        prev.map((p) =>
          p.id !== productId
            ? p
            : {
                ...p,
                variants: p.variants.filter((v) => v.id !== variantId),
                variant_count: p.variant_count - 1,
              },
        ),
      );
    } catch {
      // ignore
    } finally {
      setDeleteVariant(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản Lý Sản Phẩm</h1>
          <p className="text-gray-600 text-sm">
            Danh sách tất cả sản phẩm trong kho
          </p>
        </div>
        <Link
          href="/admin/products/add"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Thêm Sản Phẩm
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        {/* Filters */}
        <div className="p-4 border-b border-gray-200 space-y-4">
          {/* Row 1: Search + Category + Stock + Status */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm kiếm sản phẩm..."
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả tồn kho</option>
              <option value="in-stock">Còn hàng</option>
              <option value="low-stock">Sắp hết</option>
              <option value="out-of-stock">Hết hàng</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="active">Hiển thị</option>
              <option value="hidden">Ẩn</option>
            </select>
          </div>
          {/* Row 2: Price range + Sort */}
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 whitespace-nowrap">Giá:</span>
              <input
                type="number"
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
                placeholder="Từ"
                min="0"
                className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-400">—</span>
              <input
                type="number"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                placeholder="Đến"
                min="0"
                className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="newest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
              <option value="name-asc">Tên A-Z</option>
              <option value="name-desc">Tên Z-A</option>
              <option value="price-asc">Giá thấp → cao</option>
              <option value="price-desc">Giá cao → thấp</option>
              <option value="stock-asc">Tồn kho ít → nhiều</option>
              <option value="stock-desc">Tồn kho nhiều → ít</option>
            </select>
            <span className="text-sm text-gray-500">
              {filtered.length} sản phẩm
            </span>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Đang tải...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Không có sản phẩm nào.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                    Sản Phẩm
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                    Danh Mục
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                    Giá
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                    Phí Ship
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                    Tồn Kho
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                    Đã Bán
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                    Trạng Thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                    Hành Động
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map((product) => {
                  const badge = stockBadge(product.total_stock);
                  const isExpanded = expandedIds.has(product.id);
                  const hasVariants = product.variant_count > 0;

                  return (
                    <Fragment key={product.id}>
                      {/* Product row */}
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            {/* Expand toggle */}
                            <button
                              onClick={() => toggleExpand(product.id)}
                              className="p-1 hover:bg-gray-200 rounded transition-colors"
                              aria-label={isExpanded ? "Thu gọn" : "Mở rộng"}
                              disabled={!hasVariants}
                            >
                              {hasVariants ? (
                                isExpanded ? (
                                  <ChevronDown className="w-4 h-4 text-gray-600" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-gray-600" />
                                )
                              ) : (
                                <span className="w-4 h-4 inline-block" />
                              )}
                            </button>

                            {/* Avatar */}
                            <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                              {product.avatar ? (
                                <Image
                                  src={product.avatar}
                                  alt={product.name}
                                  width={48}
                                  height={48}
                                  unoptimized
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <ImageIcon className="w-5 h-5 text-gray-400" />
                                </div>
                              )}
                            </div>

                            {/* Name + ID */}
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {product.name}
                              </p>
                              <div className="flex items-center gap-1">
                                <p className="text-xs text-gray-400 font-mono">
                                  #{product.id.slice(0, 8)}
                                </p>
                                <button
                                  onClick={() => copyToClipboard(product.id)}
                                  className="p-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                                  title="Copy ID"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                              {hasVariants && (
                                <p className="text-xs text-gray-500">
                                  {product.variant_count} biến thể
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                          {categoryName(product.category_id)}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                          {product.default_price.toLocaleString("vi-VN")}₫
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                          {(product.shipping_cost ?? 0).toLocaleString("vi-VN")}₫
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {product.total_stock}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                          {product.total_sold}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${badge.cls}`}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                router.push(`/admin/products/${product.id}`)
                              }
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Chỉnh sửa"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteId(product.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Xóa"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Variants row */}
                      {isExpanded && hasVariants && (
                        <tr>
                          <td colSpan={8} className="p-0 bg-gray-50">
                            <ProductListVariantsTable
                              product={product}
                              onDeleteVariant={(variantId) =>
                                setDeleteVariant({ productId: product.id, variantId })
                              }
                            />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <DeleteConfirmModal
        isOpen={deleteId !== null}
        title="Xóa Sản Phẩm"
        message="Bạn có chắc chắn muốn xóa sản phẩm này? Hành động này không thể hoàn tác."
        onConfirm={handleDelete}
        onClose={() => setDeleteId(null)}
      />
      <DeleteConfirmModal
        isOpen={deleteVariant !== null}
        title="Xóa Biến Thể"
        message="Bạn có chắc chắn muốn xóa biến thể này? Hành động này không thể hoàn tác."
        onConfirm={handleDeleteVariant}
        onClose={() => setDeleteVariant(null)}
      />
    </div>
  );
}
