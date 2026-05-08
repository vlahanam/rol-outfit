'use client';

import { useState, useEffect, useMemo } from 'react';
import { ShoppingCart, Minus, Plus, ArrowLeft } from 'lucide-react';
import { Footer } from '@/components/Footer';
import { ImageGallery } from '@/components/product/image-gallery';
import { TagBadges } from '@/components/product/tag-badges';
import { VariantPicker } from '@/components/product/variant-picker';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { isLoggedIn } from '@/lib/auth';
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
  const [cartMsg, setCartMsg] = useState<string | null>(null);

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

  const hasVariants = variants.length > 0;
  const axisCount = product?.attribute_names?.length ?? 0;
  const allPicked = hasVariants && Object.keys(selected).length === axisCount && Object.values(selected).every(Boolean);
  const variant = allPicked ? resolveVariant(variants, selected) : null;

  const price = variant?.price ?? product?.default_price ?? 0;
  const stock = variant?.stock ?? null;
  const outOfStock = variant !== null && stock !== null && stock <= 0;
  const needsPick = hasVariants && !allPicked;
  const cartDisabled = addingToCart || needsPick || outOfStock;

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
    if (needsPick) { setCartMsg('Vui lòng chọn phân loại sản phẩm'); return; }
    setAddingToCart(true);
    setCartMsg(null);
    try {
      await api.post('/cart/items', {
        product_id: product.id,
        ...(variant ? { attr_id: variant.id } : {}),
        quantity,
      });
      setCartMsg('Đã thêm vào giỏ hàng!');
    } catch {
      setCartMsg('Không thể thêm vào giỏ hàng');
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
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Link href="/shop" className="flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-6 transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span>Quay lại</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          <ImageGallery images={images} activeIndex={imageIdx} onSelect={setImageIdx} alt={product.name} />

          <div>
            <TagBadges tags={product.tags ?? []} />
            <h1 className="text-3xl font-bold text-gray-900 mb-3">{product.name}</h1>
            <div className="mb-4">
              <span className="text-3xl font-bold text-blue-600">{formatPrice(price)}</span>
              {variant && stock !== null && (
                <p className={`text-sm mt-1 ${stock > 0 ? 'text-gray-500' : 'text-red-500'}`}>
                  {stock > 0 ? `Còn ${stock} sản phẩm` : 'Hết hàng'}
                </p>
              )}
            </div>

            {product.description && (
              <div className="border-t border-gray-200 pt-4 mb-4">
                <p className="text-gray-600 leading-relaxed">{product.description}</p>
              </div>
            )}

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
            </div>

            {cartMsg && (
              <p className={`text-sm mb-3 ${cartMsg.includes('Đã') ? 'text-green-600' : 'text-red-600'}`}>{cartMsg}</p>
            )}

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
      </div>
      <Footer />
    </div>
  );
}
