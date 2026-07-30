'use client';

import { useEffect, useState, useRef } from 'react';
import { Settings, Loader2, Save, ExternalLink, MessageCircle, Upload, ImageIcon, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { adminSettings, uploads, type SocialLinks, type QRData } from '@/lib/api-resources';

export default function SettingsPage() {
  const [links, setLinks] = useState<SocialLinks>({
    facebook_url: '',
    zalo_url: '',
    instagram_url: '',
    line_url: '',
    email: '',
  });
  const [chatUrl, setChatUrl] = useState('');
  const [qrData, setQrData] = useState<QRData>({ nhat_text: '', nhat_text_ja: '', viet_url: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingChat, setSavingChat] = useState(false);
  const [savingQR, setSavingQR] = useState(false);
  const [uploadingViet, setUploadingViet] = useState(false);
  const vietInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const [socialRes, chatRes, qrRes] = await Promise.all([
          adminSettings.getSocialLinks(),
          adminSettings.getChatUrl(),
          adminSettings.getQR(),
        ]);
        setLinks(socialRes.data);
        setChatUrl(chatRes.data?.chat_url || '');
        setQrData(qrRes.data);
      } catch {
        toast.error('Không thể tải cài đặt');
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleUploadVietQR = async (file: File) => {
    try {
      const result = await uploads.upload(file, "settings");
      setQrData((prev) => ({ ...prev, viet_url: result.url }));
      toast.success('Đã tải lên ảnh QR Việt');
    } catch {
      toast.error('Không thể tải lên ảnh QR');
    }
  };

  const handleSaveQR = async () => {
    setSavingQR(true);
    try {
      await adminSettings.updateQR(qrData);
      toast.success('Đã lưu cài đặt QR');
    } catch {
      toast.error('Không thể lưu cài đặt QR');
    } finally {
      setSavingQR(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminSettings.updateSocialLinks(links);
      toast.success('Đã lưu cài đặt');
    } catch {
      toast.error('Không thể lưu cài đặt');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveChatUrl = async () => {
    setSavingChat(true);
    try {
      await adminSettings.updateChatUrl(chatUrl);
      toast.success('Đã lưu Chat URL');
    } catch {
      toast.error('Không thể lưu Chat URL');
    } finally {
      setSavingChat(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Cài Đặt</h1>
        <p className="text-gray-600">Quản lý cài đặt website</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Settings className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Liên Kết Mạng Xã Hội</h2>
              <p className="text-sm text-gray-500">Icon sẽ hiển thị ở góc dưới bên phải trang web</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Facebook URL
            </label>
            <div className="relative">
              <input
                type="url"
                value={links.facebook_url}
                onChange={(e) => setLinks({ ...links, facebook_url: e.target.value })}
                placeholder="https://facebook.com/your-page"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {links.facebook_url && (
                <a
                  href={links.facebook_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-500">Để trống nếu không muốn hiển thị icon Facebook</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Zalo URL
            </label>
            <div className="relative">
              <input
                type="url"
                value={links.zalo_url}
                onChange={(e) => setLinks({ ...links, zalo_url: e.target.value })}
                placeholder="https://zalo.me/your-number"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {links.zalo_url && (
                <a
                  href={links.zalo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-500">Để trống nếu không muốn hiển thị icon Zalo</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Instagram URL
            </label>
            <div className="relative">
              <input
                type="url"
                value={links.instagram_url}
                onChange={(e) => setLinks({ ...links, instagram_url: e.target.value })}
                placeholder="https://instagram.com/your-profile"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {links.instagram_url && (
                <a
                  href={links.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-500">Để trống nếu không muốn hiển thị Instagram</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              TikTok URL
            </label>
            <div className="relative">
              <input
                type="url"
                value={links.line_url}
                onChange={(e) => setLinks({ ...links, line_url: e.target.value })}
                placeholder="https://tiktok.com/@your-username"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {links.line_url && (
                <a
                  href={links.line_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-500">Để trống nếu không muốn hiển thị TikTok</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Liên Hệ
            </label>
            <div className="relative">
              <input
                type="email"
                value={links.email}
                onChange={(e) => setLinks({ ...links, email: e.target.value })}
                placeholder="contact@roloutfit.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {links.email && (
                <a
                  href={`mailto:${links.email}`}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-500">Để trống nếu không muốn hiển thị Email</p>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Lưu Cài Đặt
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <MessageCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Chat / Liên Hệ</h2>
              <p className="text-sm text-gray-500">Nút "Nhắn tin ngay" sẽ hiển thị trên trang sản phẩm</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chat URL (Zalo, LINE, Messenger...)
            </label>
            <div className="relative">
              <input
                type="url"
                value={chatUrl}
                onChange={(e) => setChatUrl(e.target.value)}
                placeholder="https://zalo.me/your-number"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              {chatUrl && (
                <a
                  href={chatUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-600"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-500">Để trống nếu không muốn hiển thị nút chat trên trang sản phẩm</p>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleSaveChatUrl}
              disabled={savingChat}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savingChat ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Lưu Chat URL
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <ImageIcon className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Mã QR Thanh Toán</h2>
              <p className="text-sm text-gray-500">Hiển thị sau khi khách hàng đặt hàng</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Thông tin chuyển khoản hàng Nhật (¥) - Tiếng Việt
              </label>
              <div className="space-y-3 mb-4">
                <textarea
                  value={qrData.nhat_text}
                  onChange={(e) => setQrData((prev) => ({ ...prev, nhat_text: e.target.value }))}
                  placeholder="Nhập thông tin tài khoản ngân hàng, số tài khoản, nội dung..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                {qrData.nhat_text && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-500 mb-1">Xem trước:</p>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{qrData.nhat_text}</p>
                  </div>
                )}
              </div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                日本向け銀行振込情報 (¥) - 日本語
              </label>
              <div className="space-y-3">
                <textarea
                  value={qrData.nhat_text_ja}
                  onChange={(e) => setQrData((prev) => ({ ...prev, nhat_text_ja: e.target.value }))}
                  placeholder="口座情報、口座番号、振込内容などを入力..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                {qrData.nhat_text_ja && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-500 mb-1">プレビュー:</p>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{qrData.nhat_text_ja}</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                QR Hàng Việt (₫)
              </label>
              <div className="space-y-3">
                <div className="w-40 h-40 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center mx-auto">
                  {qrData.viet_url ? (
                    <img
                      src={qrData.viet_url}
                      alt="QR Việt"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center text-gray-400">
                      <ImageIcon className="w-8 h-8" />
                      <span className="text-xs mt-1">Chưa có ảnh</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 justify-center">
                  <input
                    ref={vietInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setUploadingViet(true);
                        handleUploadVietQR(file).finally(() => {
                          setUploadingViet(false);
                          if (vietInputRef.current) vietInputRef.current.value = '';
                        });
                      }
                    }}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => vietInputRef.current?.click()}
                    disabled={uploadingViet}
                    className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    {uploadingViet ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    Tải ảnh
                  </button>
                  {qrData.viet_url && (
                    <button
                      type="button"
                      onClick={() => setQrData((prev) => ({ ...prev, viet_url: '' }))}
                      className="inline-flex items-center gap-2 px-3 py-2 border border-red-300 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      Xóa
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleSaveQR}
              disabled={savingQR}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savingQR ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Lưu Cài Đặt QR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
