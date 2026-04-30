import { Users, Package, ShoppingCart, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';

export default function DashboardPage() {
  const stats = [
    { icon: DollarSign, label: 'Tổng Doanh Thu', value: '125.000.000₫', change: '+12.5%', isPositive: true, bgColor: 'bg-green-50', iconColor: 'text-green-600' },
    { icon: ShoppingCart, label: 'Đơn Hàng', value: '1,234', change: '+8.2%', isPositive: true, bgColor: 'bg-blue-50', iconColor: 'text-blue-600' },
    { icon: Users, label: 'Người Dùng', value: '8,567', change: '+3.1%', isPositive: true, bgColor: 'bg-purple-50', iconColor: 'text-purple-600' },
    { icon: Package, label: 'Sản Phẩm', value: '456', change: '-2.4%', isPositive: false, bgColor: 'bg-orange-50', iconColor: 'text-orange-600' },
  ];

  const recentOrders = [
    { id: '#ORD-001', customer: 'Nguyễn Văn A', total: '1.200.000₫', status: 'Đang giao', date: '29/04/2026' },
    { id: '#ORD-002', customer: 'Trần Thị B', total: '850.000₫', status: 'Hoàn thành', date: '29/04/2026' },
    { id: '#ORD-003', customer: 'Lê Văn C', total: '2.400.000₫', status: 'Chờ xử lý', date: '28/04/2026' },
    { id: '#ORD-004', customer: 'Phạm Thị D', total: '680.000₫', status: 'Đang giao', date: '28/04/2026' },
    { id: '#ORD-005', customer: 'Hoàng Văn E', total: '1.500.000₫', status: 'Hoàn thành', date: '27/04/2026' },
  ];

  const topProducts = [
    { name: 'Áo Thun Cotton Premium', sold: 245, revenue: '176.400.000₫' },
    { name: 'Quần Jeans Denim', sold: 198, revenue: '308.880.000₫' },
    { name: 'Giày Thể Thao', sold: 167, revenue: '317.300.000₫' },
    { name: 'Áo Khoác Mùa Đông', sold: 134, revenue: '498.480.000₫' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Hoàn thành': return 'bg-green-100 text-green-700';
      case 'Đang giao': return 'bg-blue-100 text-blue-700';
      case 'Chờ xử lý': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Tổng quan về hoạt động kinh doanh</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
              </div>
              <div className={`flex items-center gap-1 text-sm font-medium ${stat.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {stat.isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {stat.change}
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Đơn Hàng Gần Đây</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Mã ĐH</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Khách Hàng</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Tổng Tiền</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Trạng Thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">{order.id}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{order.customer}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">{order.total}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Sản Phẩm Bán Chạy</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{product.name}</p>
                    <p className="text-xs text-gray-500">Đã bán: {product.sold} sản phẩm</p>
                  </div>
                  <p className="text-sm font-semibold text-blue-600">{product.revenue}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
