import { CollectionCard } from '@/components/CollectionCard';
import { ProductItem } from '@/components/ProductItem';
import { TrendingCard } from '@/components/TrendingCard';
import { Footer } from '@/components/Footer';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-gray-900">Bộ Sưu Tập Đặc Biệt</h2>
            <div className="flex gap-2">
              <button className="p-2 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button className="p-2 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 h-[500px]">
            <CollectionCard
              title="Thời Trang Công Sở"
              image="https://images.unsplash.com/photo-1599012307530-d163bd04ecab?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
            />
            <CollectionCard
              title="Phụ Kiện"
              image="https://images.unsplash.com/photo-1705675451868-014a161e591b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
            />
            <CollectionCard
              title="Thời Trang Nữ"
              image="https://images.unsplash.com/photo-1627342229908-71efbac25f08?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
            />
            <CollectionCard
              title="Giày Thể Thao"
              image="https://images.unsplash.com/photo-1721884258144-5d788061e4c4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
            />
          </div>
        </section>

        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-gray-900">Hàng Mới Về</h2>
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
                name="Áo Thun Cotton Logo"
                price="720.000₫"
                image="https://images.unsplash.com/photo-1599012307530-d163bd04ecab?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400"
                rating={4.5}
                isNew
              />
            </Link>
            <ProductItem
              name="Vest Công Sở May Đo"
              price="4.480.000₫"
              image="https://images.unsplash.com/photo-1687481795360-77c1115d26c6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400"
              rating={5.0}
              isNew
            />
            <ProductItem
              name="Áo Len Tròn Cổ"
              price="2.840.000₫"
              image="https://images.unsplash.com/photo-1732257119942-a19648e482f2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400"
              rating={4.8}
              isNew
            />
            <ProductItem
              name="Cặp Da Cao Cấp"
              price="8.360.000₫"
              image="https://images.unsplash.com/photo-1721884258091-4fe7b737fb08?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400"
              rating={4.7}
              isNew
            />
            <ProductItem
              name="Giày Tây Cổ Điển"
              price="1.780.000₫"
              image="https://images.unsplash.com/photo-1770226415002-dbbd40327ec7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400"
              rating={4.6}
              isNew
            />
            <ProductItem
              name="Áo Sơ Mi Casual"
              price="1.040.000₫"
              image="https://images.unsplash.com/photo-1769981653696-5ce5a59263bf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400"
              rating={4.4}
              isNew
            />
            <ProductItem
              name="Áo Khoác Mùa Đông"
              price="3.720.000₫"
              image="https://images.unsplash.com/photo-1705675451868-014a161e591b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400"
              rating={4.9}
              isNew
            />
            <ProductItem
              name="Giày Thể Thao"
              price="1.900.000₫"
              image="https://images.unsplash.com/photo-1721884258144-5d788061e4c4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400"
              rating={4.7}
              isNew
            />
            <ProductItem
              name="Quần Jeans Denim"
              price="1.560.000₫"
              image="https://images.unsplash.com/photo-1627342229908-71efbac25f08?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400"
              rating={4.5}
              isNew
            />
            <ProductItem
              name="Đầm Mùa Hè"
              price="2.240.000₫"
              image="https://images.unsplash.com/photo-1732257119942-a19648e482f2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400"
              rating={4.8}
              isNew
            />
          </div>
        </section>

        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-gray-900">Xu Hướng Hot</h2>
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
              title="Bộ Sưu Tập Thu Gradient"
              image="https://images.unsplash.com/photo-1705675451868-014a161e591b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800"
            />
            <TrendingCard
              title="Phong Cách Halloween"
              image="https://images.unsplash.com/photo-1687481795360-77c1115d26c6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800"
            />
            <TrendingCard
              title="Quần Jeans Xanh Chính Hiệu"
              image="https://images.unsplash.com/photo-1732257119942-a19648e482f2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800"
            />
            <TrendingCard
              title="Quần Jeans Công Sở"
              image="https://images.unsplash.com/photo-1769981653696-5ce5a59263bf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800"
            />
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
