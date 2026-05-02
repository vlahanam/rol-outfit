'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart, Minus, Plus, ArrowLeft } from 'lucide-react';
import { ProductItem } from '@/components/ProductItem';
import { Footer } from '@/components/Footer';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { isLoggedIn } from '@/lib/auth';
import type { ApiResponse, Product } from '@/types/api';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1599012307530-d163bd04ecab?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080';

function formatPrice(value: number): string {
  return value.toLocaleString('vi-VN') + '₫';
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartMsg, setCartMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await api.get<ApiResponse<Product>>(`/products/${id}`);
        setProduct(res.data);
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProduct();
  }, [id]);

  const handleAddToCart = async () => {
    if (!isLoggedIn()) {
      router.push('/login');
      return;
    }
    if (!product) return;
    setAddingToCart(true);
    setCartMsg(null);
    try {
      await api.post('/cart/items', { product_id: product.id, quantity });
      setCartMsg('Đã thêm vào giỏ hàng!');
    } catch {
      setCartMsg('Không thể thêm vào giỏ hàng');
    } finally {
      setAddingToCart(false);
    }
  };

  const images = product?.avatar ? [product.avatar] : [FALLBACK_IMAGE];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Đang tải...</p>
      </div>
    );
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
          <div>
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
              <img
                src={images[selectedImage] || FALLBACK_IMAGE}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-3 gap-4">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImage === idx ? 'border-blue-600' : 'border-transparent'
                    }`}
                  >
                    <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="mb-4">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>
              <div className="mb-6">
                <span className="text-3xl font-bold text-blue-600">{formatPrice(product.default_price)}</span>
              </div>
            </div>

            {product.description && (
              <div className="border-t border-gray-200 pt-6 mb-6">
                <p className="text-gray-600 leading-relaxed">{product.description}</p>
              </div>
            )}

            <div className="mb-6">
              <h3 className="font-semibold mb-3">Số Lượng</h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center font-semibold">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {cartMsg && (
              <p className={`text-sm mb-3 ${cartMsg.includes('Đã') ? 'text-green-600' : 'text-red-600'}`}>{cartMsg}</p>
            )}

            <button
              onClick={handleAddToCart}
              disabled={addingToCart}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <ShoppingCart className="w-5 h-5" />
              {addingToCart ? 'Đang thêm...' : 'Thêm Vào Giỏ Hàng'}
            </button>

            <div className="mt-6 border-t border-gray-200 pt-6">
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                  Miễn phí vận chuyển cho đơn hàng trên 500.000₫
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                  Đổi trả trong vòng 7 ngày
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                  Hàng chính hãng 100%
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
