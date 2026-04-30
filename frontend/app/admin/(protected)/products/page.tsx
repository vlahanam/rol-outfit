'use client';

import { useState, Fragment } from 'react';
import { Plus, Search, ChevronDown, ChevronRight, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DeleteConfirmModal } from '@/components/admin/DeleteConfirmModal';

const mockProducts = [
  {
    id: 1,
    name: 'Áo Thun Cotton Premium',
    category: 'Áo',
    price: '720.000₫',
    status: 'Còn hàng',
    variants: [
      { id: 1, sku: 'ATC-S-TRANG', color: 'Trắng', size: 'S', stock: 50 },
      { id: 2, sku: 'ATC-M-TRANG', color: 'Trắng', size: 'M', stock: 30 },
      { id: 3, sku: 'ATC-S-DEN', color: 'Đen', size: 'S', stock: 20 },
    ],
  },
  {
    id: 2,
    name: 'Quần Jeans Denim',
    category: 'Quần',
    price: '1.560.000₫',
    status: 'Còn hàng',
    variants: [
      { id: 4, sku: 'QJD-30-XANH', color: 'Xanh', size: '30', stock: 15 },
      { id: 5, sku: 'QJD-32-XANH', color: 'Xanh', size: '32', stock: 10 },
    ],
  },
  {
    id: 3,
    name: 'Giày Thể Thao',
    category: 'Giày',
    price: '1.900.000₫',
    status: 'Hết hàng',
    variants: [],
  },
];

export default function ListProductPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [expandedIds, setExpandedIds] = useState<number[]>([]);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const filtered = mockProducts.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === '' || p.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản Lý Sản Phẩm</h1>
          <p className="text-gray-600">Danh sách tất cả sản phẩm</p>
        </div>
        <Link href="/admin/products/add" className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
          <Plus className="w-4 h-4" />
          Thêm Sản Phẩm
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-4">
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
            <option value="Áo">Áo</option>
            <option value="Quần">Quần</option>
            <option value="Giày">Giày</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-max">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Tên Sản Phẩm</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Danh Mục</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Giá</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Trạng Thái</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Hành Động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map((product) => (
                <Fragment key={product.id}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                      <button onClick={() => toggleExpand(product.id)} className="flex items-center gap-1">
                        {expandedIds.includes(product.id) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        #{product.id}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">{product.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{product.category}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">{product.price}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${product.status === 'Còn hàng' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {product.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button onClick={() => router.push(`/admin/products/${product.id}`)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteId(product.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedIds.includes(product.id) && product.variants.length > 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-2 bg-gray-50">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-xs text-gray-500 uppercase">
                              <th className="text-left py-2 pr-4 whitespace-nowrap">SKU</th>
                              <th className="text-left py-2 pr-4 whitespace-nowrap">Màu</th>
                              <th className="text-left py-2 pr-4 whitespace-nowrap">Size</th>
                              <th className="text-left py-2 whitespace-nowrap">Tồn Kho</th>
                            </tr>
                          </thead>
                          <tbody>
                            {product.variants.map((v) => (
                              <tr key={v.id}>
                                <td className="py-1.5 pr-4 font-mono text-xs whitespace-nowrap">{v.sku}</td>
                                <td className="py-1.5 pr-4 whitespace-nowrap">{v.color}</td>
                                <td className="py-1.5 pr-4 whitespace-nowrap">{v.size}</td>
                                <td className="py-1.5 whitespace-nowrap">{v.stock}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <DeleteConfirmModal
        isOpen={deleteId !== null}
        title="Xóa Sản Phẩm"
        message="Bạn có chắc chắn muốn xóa sản phẩm này? Hành động này không thể hoàn tác."
        onConfirm={() => { console.log('Delete product', deleteId); setDeleteId(null); }}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
}
