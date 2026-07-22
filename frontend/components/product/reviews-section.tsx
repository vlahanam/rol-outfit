"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { StarRating } from "./star-rating";
import { ReviewForm } from "./review-form";
import { productReviews } from "@/lib/api-resources";
import { isLoggedIn } from "@/lib/auth";
import type { ProductReview, ReviewStats } from "@/types/api";

interface ReviewsSectionProps {
  productId: string;
}

export function ReviewsSection({ productId }: ReviewsSectionProps) {
  const t = useTranslations("ProductDetailPage");
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [canReview, setCanReview] = useState(false);
  const [reviewReason, setReviewReason] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const fetchReviews = useCallback(async (pageNum: number, append = false) => {
    try {
      const res = await productReviews.list(productId, pageNum, 5);
      if (append) {
        setReviews((prev) => [...prev, ...(res.data ?? [])]);
      } else {
        setReviews(res.data ?? []);
      }
      setHasMore((res.paging?.total ?? 0) > pageNum * 5);
    } catch {
      if (!append) setReviews([]);
    }
  }, [productId]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await productReviews.getStats(productId);
      setStats(res.data);
    } catch {
      setStats(null);
    }
  }, [productId]);

  const checkCanReview = useCallback(async () => {
    if (!isLoggedIn()) {
      setCanReview(false);
      setReviewReason("not_logged_in");
      return;
    }
    try {
      const res = await productReviews.canReview(productId);
      setCanReview(res.data.can_review);
      setReviewReason(res.data.reason ?? null);
    } catch {
      setCanReview(false);
    }
  }, [productId]);

  useEffect(() => {
    Promise.all([fetchReviews(1), fetchStats(), checkCanReview()]).finally(() =>
      setLoading(false),
    );
  }, [fetchReviews, fetchStats, checkCanReview]);

  const handleReviewSuccess = () => {
    setPage(1);
    fetchReviews(1);
    fetchStats();
    checkCanReview();
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchReviews(nextPage, true);
  };

  if (loading) {
    return (
      <section className="border-t border-gray-200 pt-8 mt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t("reviews")}</h2>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4" />
          <div className="h-20 bg-gray-200 rounded" />
        </div>
      </section>
    );
  }

  return (
    <section className="border-t border-gray-200 pt-8 mt-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{t("reviews")}</h2>

      {stats && stats.total_count > 0 && (
        <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">
              {stats.average_rating.toFixed(1)}
            </div>
            <StarRating value={Math.round(stats.average_rating)} readonly size="sm" />
            <div className="text-sm text-gray-500 mt-1">
              {t("reviewCount", { count: stats.total_count })}
            </div>
          </div>

          <div className="flex-1 space-y-1">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = stats.distribution[star] ?? 0;
              const percent = stats.total_count > 0 ? (count / stats.total_count) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-2 text-sm">
                  <span className="w-3">{star}</span>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 rounded-full"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="w-8 text-gray-500 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {canReview && (
        <div className="mb-6">
          <ReviewForm productId={productId} onSuccess={handleReviewSuccess} />
        </div>
      )}

      {!canReview && reviewReason && (
        <div className="mb-6 p-3 bg-gray-100 rounded-lg text-sm text-gray-600">
          {reviewReason === "not_logged_in" && t("loginToReview")}
          {reviewReason === "not_purchased" && t("purchaseToReview")}
          {reviewReason === "already_reviewed" && t("alreadyReviewed")}
        </div>
      )}

      {reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="border-b border-gray-100 pb-4 last:border-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{review.user_name}</span>
                  <StarRating value={review.rating} readonly size="sm" />
                </div>
                <span className="text-sm text-gray-500">
                  {new Date(review.created_at).toLocaleDateString()}
                </span>
              </div>
              {review.comment && (
                <p className="text-gray-600 text-sm">{review.comment}</p>
              )}
            </div>
          ))}

          {hasMore && (
            <button
              onClick={handleLoadMore}
              className="w-full py-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              {t("loadMoreReviews")}
            </button>
          )}
        </div>
      ) : (
        <p className="text-gray-500 text-sm">{t("noReviews")}</p>
      )}
    </section>
  );
}
