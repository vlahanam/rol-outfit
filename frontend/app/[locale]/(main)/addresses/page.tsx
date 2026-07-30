"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, MapPin, Plus, Star, Pencil, Trash2, X, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { isLoggedIn } from "@/lib/auth";
import { userAddresses } from "@/lib/api-resources";
import { ApiError } from "@/lib/api-client";
import { createAddressSchema } from "@/lib/validations";
import type { UserAddress } from "@/types/api";

export default function AddressesPage() {
  const t = useTranslations("AddressesPage");
  const tCommon = useTranslations("Common");
  const router = useRouter();

  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    recipient_name: "",
    phone: "",
    address: "",
    postal_code: "",
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
  });

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }
    fetchAddresses();
  }, [router]);

  const fetchAddresses = async () => {
    try {
      const res = await userAddresses.list();
      setAddresses(res.data ?? []);
    } catch {
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const schema = createAddressSchema(t);
    const result = schema.safeParse(formData);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) errors[issue.path[0] as string] = issue.message;
      });
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        await userAddresses.update(editingId, formData);
      } else {
        await userAddresses.create(formData);
      }
      await fetchAddresses();
      resetForm();
    } catch (err) {
      if (err instanceof ApiError && err.details) {
        const normalized: Record<string, string> = {};
        for (const [key, msg] of Object.entries(err.details)) {
          const snakeKey = key.replace(/([A-Z])/g, "_$1").toLowerCase().replace(/^_/, "");
          normalized[snakeKey] = msg;
        }
        setFieldErrors(normalized);
      }
      setError(err instanceof ApiError ? err.message : tCommon("errorLoading"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("confirmDelete"))) return;
    try {
      await userAddresses.remove(id);
      await fetchAddresses();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : tCommon("errorLoading"));
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await userAddresses.setDefault(id);
      await fetchAddresses();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : tCommon("errorLoading"));
    }
  };

  const startEdit = (addr: UserAddress) => {
    setEditingId(addr.id);
    setFormData({
      recipient_name: addr.recipient_name,
      phone: addr.phone,
      address: addr.address,
      postal_code: addr.postal_code,
      latitude: addr.latitude ?? undefined,
      longitude: addr.longitude ?? undefined,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFieldErrors({});
    setError(null);
    setFormData({ recipient_name: "", phone: "", address: "", postal_code: "", latitude: undefined, longitude: undefined });
  };


  const canAddMore = addresses.length < 5;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
        <Link
          href="/"
          className="flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>{tCommon("backToHome")}</span>
        </Link>

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          {canAddMore && !showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              {t("addNew")}
            </button>
          )}
          {!canAddMore && (
            <span className="text-sm text-gray-500">{t("maxAddresses")}</span>
          )}
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                {editingId ? t("edit") : t("addNew")}
              </h2>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("recipientName")} *
                </label>
                <input
                  type="text"
                  value={formData.recipient_name}
                  onChange={(e) => {
                    setFormData({ ...formData, recipient_name: e.target.value });
                    setFieldErrors((p) => ({ ...p, recipient_name: "" }));
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${fieldErrors.recipient_name ? "border-red-500" : "border-gray-300"}`}
                />
                {fieldErrors.recipient_name && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.recipient_name}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("phone")} *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => {
                    setFormData({ ...formData, phone: e.target.value });
                    setFieldErrors((p) => ({ ...p, phone: "" }));
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${fieldErrors.phone ? "border-red-500" : "border-gray-300"}`}
                />
                {fieldErrors.phone && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.phone}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("address")} *
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => {
                    setFormData({ ...formData, address: e.target.value });
                    setFieldErrors((p) => ({ ...p, address: "" }));
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${fieldErrors.address ? "border-red-500" : "border-gray-300"}`}
                  rows={3}
                  placeholder={t("enterAddress")}
                />
                {fieldErrors.address && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.address}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("postalCode")} *
                </label>
                <input
                  type="text"
                  value={formData.postal_code}
                  onChange={(e) => {
                    setFormData({ ...formData, postal_code: e.target.value });
                    setFieldErrors((p) => ({ ...p, postal_code: "" }));
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${fieldErrors.postal_code ? "border-red-500" : "border-gray-300"}`}
                  placeholder="123-4567"
                />
                {fieldErrors.postal_code && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.postal_code}</p>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {t("save")}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {t("cancel")}
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-500">{tCommon("loading")}</div>
        ) : addresses.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center">
            <MapPin className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold mb-2">{t("noAddresses")}</h2>
            <p className="text-gray-600 mb-6">{t("addFirst")}</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              {t("addNew")}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {addresses.map((addr) => (
              <div key={addr.id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900">{addr.recipient_name}</span>
                      {addr.is_default && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded">
                          <Star className="w-3 h-3 fill-current" />
                          {t("default")}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{addr.phone}</p>
                    <p className="text-sm text-gray-600">{addr.address}</p>
                    {addr.postal_code && <p className="text-sm text-gray-600">{t("postalCode")}: {addr.postal_code}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {!addr.is_default && (
                      <button
                        onClick={() => handleSetDefault(addr.id)}
                        className="text-sm text-blue-600 hover:text-blue-700 px-3 py-1 rounded hover:bg-blue-50 transition-colors"
                      >
                        {t("setDefault")}
                      </button>
                    )}
                    <button
                      onClick={() => startEdit(addr)}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(addr.id)}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
  );
}
