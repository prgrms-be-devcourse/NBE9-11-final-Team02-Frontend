"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/http";
import { getMyFacilityReviews } from "@/lib/review";
import type { FacilityReviewResponse } from "@/lib/types";

function formatDate(iso: string): string {
    return iso.slice(0, 10).replace(/-/g, ".");
}

function Stars({ rating }: { rating: number }) {
    const filled = Math.round(rating);
    return (
        <span className="text-sm font-medium text-amber-500">
            {"★".repeat(filled)}
            <span className="text-zinc-300">{"★".repeat(Math.max(0, 5 - filled))}</span>
            <span className="ml-1.5 text-zinc-700">{rating.toFixed(1)}</span>
        </span>
    );
}

export default function MyFacilityReviewsPage() {
    const { user } = useAuth();
    const [items, setItems] = useState<FacilityReviewResponse[]>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>();

    useEffect(() => {
        if (!user) return;
        let active = true;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLoading(true);
        setError(undefined);

        getMyFacilityReviews(user.userId)
            .then((res) => {
                if (active) setItems(res);
            })
            .catch((e) => {
                if (!active) return;
                setError(
                    e instanceof ApiError
                        ? e.message
                        : "내 후기를 불러오지 못했습니다.",
                );
                setItems(undefined);
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, [user]);

    return (
        <main className="flex flex-1 flex-col items-center bg-zinc-50 px-4 py-12">
            <div className="w-full max-w-2xl">
                <Link
                    href="/mypage"
                    className="mb-6 inline-block text-sm text-zinc-500 underline-offset-4 hover:underline"
                >
                    ← 마이페이지
                </Link>
                <h1 className="mb-1 text-2xl font-bold tracking-tight text-zinc-900">
                    내가 쓴 시설 후기
                </h1>
                <p className="mb-6 text-sm text-zinc-500">
                    완료된 매치에서 작성한 경기장 후기예요.
                </p>

                {loading ? (
                    <p className="py-12 text-center text-sm text-zinc-400">
                        불러오는 중…
                    </p>
                ) : error ? (
                    <p className="py-12 text-center text-sm text-red-600">{error}</p>
                ) : !items || items.length === 0 ? (
                    <p className="py-12 text-center text-sm text-zinc-400">
                        아직 작성한 시설 후기가 없습니다.
                    </p>
                ) : (
                    <ul className="flex flex-col gap-3">
                        {items.map((review) => (
                            <li
                                key={review.reviewId}
                                className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <Stars rating={review.rating} />
                                    <span className="text-xs text-zinc-400">
                                        {formatDate(review.createdAt)}
                                    </span>
                                </div>
                                {review.comment ? (
                                    <p className="mt-2 text-sm text-zinc-600">
                                        {review.comment}
                                    </p>
                                ) : null}
                                <Link
                                    href={`/facilities/${review.facilityId}`}
                                    className="mt-3 inline-block text-xs font-medium text-emerald-600 underline-offset-4 hover:underline"
                                >
                                    경기장 보기 →
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </main>
    );
}