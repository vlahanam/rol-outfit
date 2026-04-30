'use client';

import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { ProductItem } from '@/components/ProductItem';
import { Footer } from '@/components/Footer';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ShopPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [sortBy, setSortBy] = useState('newest');

  const categories = ['Tất cả', 'Áo', 'Quần', 'Giày Dép', 'Phụ Kiện'];

  const allProducts = [
    { name: 'Áo Thun Cotton Logo', price: '720.000₫', image: 'https://images.unsplash.com/photo-1599012307530-d163bd04ecab?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400', category: 'Áo', isNew: true },
    { name: 'Vest Công Sở May Đo', price: '4.480.000₫', image: 'https://images.unsplash.com/photo-1687481795360-77c1115d26c6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400', category: 'Áo', isNew: true },
    { name: 'Áo Len Tròn Cổ', price: '2.840.000₫', image: 'https://images.unsplash.com/photo-1732257119942-a19648e482f2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400', category: 'Áo', isNew: false },
    { name: 'Cặp Da Cao Cấp', price: '8.360.000₫', image: 'https://images.unsplash.com/photo-1721884258091-4fe7b737fb08?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400', category: 'Phụ Kiện', isNew: false },
    { name: 'Giày Tây Cổ Điển', price: '1.780.000₫', image: 'https://images.unsplash.com/photo-1770226415002-dbbd40327ec7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400', category: 'Giày Dép', isNew: false },
    { name: 'Áo Sơ Mi Casual', price: '1.040.000₫', image: 'https://images.unsplash.com/photo-1769981653696-5ce5a59263bf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400', category: 'Áo', isNew: true },
    { name: 'Áo Khoác Mùa Đông', price: '3.720.000₫', image: 'https://images.unsplash.com/photo-1705675451868-014a161e591b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400', category: 'Áo', isNew: true },
    { name: 'Giày Thể Thao', price: '1.900.000₫', image: 'https://images.unsplash.com/photo-1721884258144-5d788061e4c4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400', category: 'Giày Dép', isNew: true },
    { name: 'Quần Jeans Denim', price: '1.560.000₫', image: 'https://images.unsplash.com/photo-1627342229908-71efbac25f08?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400', category: 'Quần', isNew: false },
    { name: 'Đầm Mùa Hè', price: '2.240.000₫', image: 'https://images.unsplash.com/photo-1732257119942-a19648e482f2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400', category: 'Áo', isNew: false },
    { name: 'Quần Kaki Slim Fit', price: '890.000₫', image: 'https://images.unsplash.com/photo-1599012307530-d163bd04ecab?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400', category: 'Quần', isNew: true },
    { name: 'Túi Xách Da Thật', price: '3.200.000₫', image: 'https://images.unsplash.com/photo-1721884258091-4fe7b737fb08?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400', category: 'Phụ Kiện', isNew: false },
  ];

  const filteredProducts = allProducts.filter((product) =>
    selectedCategory === 'Tất cả' || product.category === selectedCategory
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-6 transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span>Về trang chủ</span>
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Cửa Hàng</h1>
          <p className="text-gray-600">Khám phá bộ sưu tập thời trang của chúng tôi</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="newest">Mới nhất</option>
            <option value="price-low">Giá thấp đến cao</option>
            <option value="price-high">Giá cao đến thấp</option>
          </select>
        </div>

        <div className="mb-4">
          <p className="text-gray-600">
            Hiển thị <span className="font-semibold">{filteredProducts.length}</span> sản phẩm
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {filteredProducts.map((product, idx) => (
            <div key={idx} onClick={() => router.push('/product/1')} className="cursor-pointer">
              <ProductItem {...product} />
            </div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Không tìm thấy sản phẩm nào</p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
