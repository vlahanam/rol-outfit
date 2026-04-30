'use client';

import { useState } from 'react';
import { ShoppingCart, Minus, Plus, ArrowLeft } from 'lucide-react';
import { ProductItem } from '@/components/ProductItem';
import { Footer } from '@/components/Footer';
import Link from 'next/link';

export default function ProductDetailPage() {
  const [selectedSize, setSelectedSize] = useState('M');
  const [selectedColor, setSelectedColor] = useState('Xanh Dương');
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  const images = [
    'https://images.unsplash.com/photo-1599012307530-d163bd04ecab?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    'https://images.unsplash.com/photo-1687481795360-77c1115d26c6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    'https://images.unsplash.com/photo-1732257119942-a19648e482f2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  ];

  const sizes = ['S', 'M', 'L', 'XL', 'XXL'];
  const colors = ['Xanh Dương', 'Đen', 'Trắng', 'Xám'];

  const relatedProducts = [
    { name: 'Áo Sơ Mi Casual', price: '1.040.000₫', image: 'https://images.unsplash.com/photo-1769981653696-5ce5a59263bf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400', isNew: true },
    { name: 'Quần Jeans Denim', price: '1.560.000₫', image: 'https://images.unsplash.com/photo-1627342229908-71efbac25f08?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400', isNew: true },
    { name: 'Áo Khoác Mùa Đông', price: '3.720.000₫', image: 'https://images.unsplash.com/photo-1705675451868-014a161e591b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400', isNew: true },
    { name: 'Giày Tây Cổ Điển', price: '1.780.000₫', image: 'https://images.unsplash.com/photo-1770226415002-dbbd40327ec7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400', isNew: true },
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-6 transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span>Quay lại</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          <div>
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
              <img
                src={images[selectedImage]}
                alt="Product"
                className="w-full h-full object-cover"
              />
            </div>
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
          </div>

          <div>
            <div className="mb-4">
              <span className="inline-block bg-blue-100 text-blue-600 text-xs px-3 py-1 rounded-full mb-3">
                HÀNG MỚI VỀ
              </span>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Áo Thun Cotton Premium
              </h1>
              <div className="mb-6">
                <span className="text-3xl font-bold text-blue-600">720.000₫</span>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6 mb-6">
              <p className="text-gray-600 leading-relaxed">
                Áo thun cotton cao cấp với chất liệu mềm mại, thoáng mát. Thiết kế đơn giản,
                dễ phối đồ, phù hợp cho mọi hoạt động hàng ngày. Được làm từ 100% cotton tự nhiên,
                thấm hút mồ hôi tốt và thân thiện với làn da.
              </p>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold mb-3">Chọn Màu Sắc</h3>
              <div className="flex flex-wrap gap-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`px-4 py-2 border-2 rounded-lg transition-colors ${
                      selectedColor === color
                        ? 'border-blue-600 bg-blue-50 text-blue-600'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold mb-3">Chọn Size</h3>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`w-12 h-12 border-2 rounded-lg font-semibold transition-colors ${
                      selectedSize === size
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

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

            <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Thêm Vào Giỏ Hàng
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

        <section>
          <h2 className="text-2xl font-bold mb-6">Sản Phẩm Liên Quan</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {relatedProducts.map((product, idx) => (
              <ProductItem key={idx} {...product} />
            ))}
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}
