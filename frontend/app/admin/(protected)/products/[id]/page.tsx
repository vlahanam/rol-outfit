'use client';

import { useState } from 'react';
import { ArrowLeft, Pencil, Save, X } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function AdminProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [editInfo, setEditInfo] = useState(false);
  const [productInfo, setProductInfo] = useState({
    name: 'Áo Thun Cotton Premium',
    category: 'Áo',
    description: 'Áo thun cotton cao cấp, thoáng mát, phù hợp mọi dịp.',
    status: 'Còn hàng',
  });

  const [attributes] = useState([
    { key: 'Chất liệu', value: 'Cotton 100%' },
    { key: 'Xuất xứ', value: 'Việt Nam' },
    { key: 'Bảo hành', value: '6 tháng' },
  ]);

  const [variants] = useState([
    { id: 1, color: 'Trắng', size: 'S', price: '720.000₫', stock: 50, sku: 'ATC-S-TRANG' },
    { id: 2, color: 'Trắng', size: 'M', price: '720.000₫', stock: 30, sku: 'ATC-M-TRANG' },
    { id: 3, color: 'Đen', size: 'S', price: '720.000₫', stock: 20, sku: 'ATC-S-DEN' },
  ]);

  const handleInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setProductInfo((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/products" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chi Tiết Sản Phẩm</h1>
          <p className="text-gray-600">ID: #{id}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Thông Tin Cơ Bản</h2>
          {editInfo ? (
            <div className="flex gap-2">
              <button onClick={() => setEditInfo(false)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                <Save className="w-4 h-4" /> Lưu
              </button>
              <button onClick={() => setEditInfo(false)} className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-sm rounded-lg hover:bg-gray-50">
                <X className="w-4 h-4" /> Hủy
              </button>
            </div>
          ) : (
            <button onClick={() => setEditInfo(true)} className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-sm rounded-lg hover:bg-gray-50">
              <Pencil className="w-4 h-4" /> Chỉnh sửa
            </button>
          )}
        </div>
        {editInfo ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tên sản phẩm</label>
              <input name="name" value={productInfo.name} onChange={handleInfoChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Danh mục</label>
              <select name="category" value={productInfo.category} onChange={handleInfoChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>Áo</option><option>Quần</option><option>Giày</option><option>Phụ kiện</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
              <select name="status" value={productInfo.status} onChange={handleInfoChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>Còn hàng</option><option>Hết hàng</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
              <textarea name="description" value={productInfo.description} onChange={handleInfoChange} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div><span className="text-gray-500">Tên sản phẩm:</span> <span className="font-medium ml-2">{productInfo.name}</span></div>
            <div><span className="text-gray-500">Danh mục:</span> <span className="font-medium ml-2">{productInfo.category}</span></div>
            <div><span className="text-gray-500">Trạng thái:</span> <span className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full ${productInfo.status === 'Còn hàng' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{productInfo.status}</span></div>
            <div className="md:col-span-2"><span className="text-gray-500">Mô tả:</span> <span className="ml-2">{productInfo.description}</span></div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Thuộc Tính</h2>
        <div className="space-y-2">
          {attributes.map((attr, i) => (
            <div key={i} className="flex items-center gap-4 text-sm">
              <span className="text-gray-500 w-32 flex-shrink-0">{attr.key}:</span>
              <span className="font-medium">{attr.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Biến Thể</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-max text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">SKU</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Màu</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Size</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Giá</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Tồn Kho</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {variants.map((v) => (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono whitespace-nowrap">{v.sku}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{v.color}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{v.size}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{v.price}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{v.stock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
