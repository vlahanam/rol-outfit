"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Send, Loader2 } from "lucide-react";
import { StarRating } from "./star-rating";
import { productReviews } from "@/lib/api-resources";

interface ReviewFormProps {
  productId: string;
  onSuccess: () => void;
}

export function ReviewForm({ productId, onSuccess }: ReviewFormProps) {
  const t = useTranslations("ProductDetailPage");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) {
      toast.error(t("invalidRating"));
      return;
    }

    setSubmitting(true);
    try {
      await productReviews.create(productId, { rating, comment });
      toast.success(t("reviewSubmitted"));
      setRating(5);
      setComment("");
      onSuccess();
    } catch {
      toast.error(t("reviewFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-4">
      <h4 className="font-medium mb-3">{t("writeReview")}</h4>

      <div className="mb-4">
        <label className="block text-sm text-gray-600 mb-1">{t("yourRating")}</label>
        <StarRating value={rating} onChange={setRating} size="lg" />
      </div>

      <div className="mb-4">
        <label className="block text-sm text-gray-600 mb-1">{t("yourComment")}</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t("commentPlaceholder")}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
        {t("submitReview")}
      </button>
    </form>
  );
}
