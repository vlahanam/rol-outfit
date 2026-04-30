export function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="font-bold text-lg mb-4">RolOutfit</h3>
            <p className="text-gray-400 text-sm">
              Điểm đến hoàn hảo cho thời trang và phong cách sống của bạn.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Công Ty</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">Giới Thiệu</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Tính Năng</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Dự Án</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Tuyển Dụng</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Hỗ Trợ</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">Chăm Sóc Khách Hàng</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Chi Tiết Giao Hàng</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Điều Khoản & Điều Kiện</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Chính Sách Bảo Mật</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Tài Nguyên</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">eBook Miễn Phí</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Hướng Dẫn Phát Triển</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Blog Hướng Dẫn</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Youtube Playlist</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
          <p>&copy; 2026 RolOutfit. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
