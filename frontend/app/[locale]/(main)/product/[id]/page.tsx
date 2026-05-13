'use client';

import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { ShoppingCart, Minus, Plus, ArrowLeft } from 'lucide-react';
import { Footer } from '@/components/Footer';
import { ImageGallery } from '@/components/product/image-gallery';
import { TagBadges } from '@/components/product/tag-badges';
import { VariantPicker } from '@/components/product/variant-picker';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { isLoggedIn } from '@/lib/auth';
import { useCart } from '@/context/cart-context';
import { useFlyToCart } from '@/hooks/use-fly-to-cart';
import type { ApiResponse, Product, ProductVariant } from '@/types/api';

function formatPrice(v: number) {
  return v.toLocaleString('vi-VN') + '₫';
}

function buildImages(p: Product | null, vs: ProductVariant[]): string[] {
  const out = new Set<string>();
  if (p?.avatar) out.add(p.avatar);
  for (const v of vs) if (v.avatar) out.add(v.avatar);
  return [...out];
}

function resolveVariant(vs: ProductVariant[], sel: Record<string, string>): ProductVariant | null {
  if (Object.values(sel).some((v) => !v)) return null;
  return vs.find((v) => Object.entries(sel).every(([k, val]) => v.attributes[k] === val)) ?? null;
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [imageIdx, setImageIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const { incrementCart } = useCart();
  const { trigger: flyToCart } = useFlyToCart();

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api.get<ApiResponse<Product>>(`/products/${id}`),
      api.get<ApiResponse<ProductVariant[]>>(`/products/${id}/variants`),
    ])
      .then(([pr, vr]) => {
        setProduct(pr.data);
        setVariants(vr.data ?? []);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const images = useMemo(() => buildImages(product, variants), [product, variants]);
  const totalStock = useMemo(() => variants.reduce((s, v) => s + (v.stock ?? 0), 0), [variants]);

  const hasVariants = variants.length > 0;
  const axisCount = product?.attribute_names?.length ?? 0;
  const allPicked = hasVariants && Object.keys(selected).length === axisCount && Object.values(selected).every(Boolean);
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
  const stockText = stockEmpty ? 'Hết hàng' : `Còn ${stockValue} sản phẩm`;

  // jump gallery to selected variant's image
  useEffect(() => {
    if (variant?.avatar) {
      const idx = images.indexOf(variant.avatar);
      if (idx >= 0) setImageIdx(idx);
    }
  }, [variant, images]);

  const handleAddToCart = async () => {
    if (!isLoggedIn()) { router.push('/login'); return; }
    if (!product) return;
    if (needsPick) { toast.warning('Vui lòng chọn phân loại sản phẩm'); return; }
    setAddingToCart(true);
    try {
      await api.post('/cart/items', {
        product_id: product.id,
        ...(variant ? { attr_id: variant.id } : {}),
        quantity,
      });
      incrementCart(quantity);
      flyToCart(images[imageIdx] ?? product.avatar ?? '');
      toast.success('Đã thêm vào giỏ hàng!');
    } catch {
      toast.error('Không thể thêm vào giỏ hàng');
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-500">Đang tải...</p></div>;
  }
  if (notFound || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-600">Không tìm thấy sản phẩm</p>
        <Link href="/shop" className="text-blue-600 hover:underline">Về cửa hàng</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-8">
        <Link href="/shop" className="flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-6 transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span>Quay lại</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <ImageGallery images={images} activeIndex={imageIdx} onSelect={setImageIdx} alt={product.name} />

          <div>
            <TagBadges tags={product.tags ?? []} />
            <h1 className="text-3xl font-bold text-gray-900 mb-3">{product.name}</h1>
            <div className="mb-4">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-3xl font-bold text-blue-600">{formatPrice(salePrice)}</span>
                {isDiscounted && (
                  <>
                    <span className="text-xl text-gray-400 line-through">{formatPrice(price)}</span>
                    <span className="px-2 py-0.5 bg-red-100 text-red-600 text-sm font-semibold rounded">
                      -{Math.round((1 - salePrice / price) * 100)}%
                    </span>
                  </>
                )}
              </div>
              {hasVariants && (
                <p className={`text-sm mt-1 ${!stockEmpty ? 'text-gray-500' : 'text-red-500'}`}>
                  {stockText}
                </p>
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
              <h3 className="font-semibold mb-3">Số Lượng</h3>
              <div className="flex items-center gap-3">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50">
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center font-semibold">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm font-semibold text-blue-700 mt-2">
                Thành tiền: {formatPrice(salePrice * quantity)}
              </p>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={cartDisabled}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <ShoppingCart className="w-5 h-5" />
              {outOfStock ? 'Hết Hàng' : needsPick ? 'Chọn Phân Loại' : addingToCart ? 'Đang thêm...' : 'Thêm Vào Giỏ Hàng'}
            </button>

            <div className="mt-6 border-t border-gray-200 pt-6">
              <ul className="space-y-2 text-sm text-gray-600">
                {['Miễn phí vận chuyển cho đơn hàng trên 500.000₫', 'Đổi trả trong vòng 7 ngày', 'Hàng chính hãng 100%'].map((t) => (
                  <li key={t} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {product.description && (
          <div className="border-t border-gray-200 pt-8 mb-12">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Mô tả sản phẩm</h2>
            <div
              className="prose prose-sm max-w-none text-gray-600"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
