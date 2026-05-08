"use client";

import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { editTagSchema } from "@/lib/validations";

const toIso = (v: string) => (v ? new Date(v).toISOString() : null);
const toLocal = (iso: string | null) =>
  iso ? new Date(iso).toISOString().slice(0, 16) : "";

export default function EditTagPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [formData, setFormData] = useState({ name: "", start_at: "", end_at: "" });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    api.adminTags
      .get(id)
      .then(({ data }) =>
        setFormData({
          name: data.name,
          start_at: toLocal(data.start_at),
          end_at: toLocal(data.end_at),
        }),
      )
      .catch((err) => setError(err instanceof ApiError ? err.message : "Có lỗi xảy ra"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const result = editTagSchema.safeParse(formData);
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) errs[issue.path[0] as string] = issue.message;
      });
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});
    setSubmitting(true);
    try {
      await api.adminTags.update(id, {
        name: formData.name,
        start_at: toIso(formData.start_at),
        end_at: toIso(formData.end_at),
      });
      router.push("/admin/tags");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Có lỗi xảy ra");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-gray-500 text-sm">Đang tải...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/tags" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chỉnh Sửa Thẻ Tag</h1>
          <p className="text-gray-600 text-sm">Cập nhật thông tin thẻ tag</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 max-w-xl">
        {error && (
          <div className="mb-4 bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tên thẻ tag <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              type="text"
              className={`w-full px-3 py-2 border ${fieldErrors.name ? "border-red-500" : "border-gray-300"} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
            {fieldErrors.name && <p className="mt-1 text-sm text-red-600">{fieldErrors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bắt đầu hiển thị <span className="text-gray-400 font-normal">(để trống = không giới hạn)</span>
            </label>
            <input
              name="start_at"
              value={formData.start_at}
              onChange={handleChange}
              type="datetime-local"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kết thúc hiển thị <span className="text-gray-400 font-normal">(để trống = không giới hạn)</span>
            </label>
            <input
              name="end_at"
              value={formData.end_at}
              onChange={handleChange}
              type="datetime-local"
              className={`w-full px-3 py-2 border ${fieldErrors.end_at ? "border-red-500" : "border-gray-300"} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
            {fieldErrors.end_at && <p className="mt-1 text-sm text-red-600">{fieldErrors.end_at}</p>}
          </div>

          <div className="flex gap-3 pt-2 border-t border-gray-200">
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Đang lưu..." : "Lưu Thay Đổi"}
            </button>
            <Link
              href="/admin/tags"
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Hủy
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
