'use client';

import { useEffect, useState } from 'react';
import { Settings, Loader2, Save, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { adminSettings, type SocialLinks } from '@/lib/api-resources';

export default function SettingsPage() {
  const [links, setLinks] = useState<SocialLinks>({
    facebook_url: '',
    zalo_url: '',
    instagram_url: '',
    line_url: '',
    email: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await adminSettings.getSocialLinks();
        setLinks(res.data);
      } catch {
        toast.error('Không thể tải cài đặt');
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

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
              LINE URL
            </label>
            <div className="relative">
              <input
                type="url"
                value={links.line_url}
                onChange={(e) => setLinks({ ...links, line_url: e.target.value })}
                placeholder="https://line.me/ti/p/your-id"
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
            <p className="mt-1 text-xs text-gray-500">Để trống nếu không muốn hiển thị LINE</p>
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
    </div>
  );
}
