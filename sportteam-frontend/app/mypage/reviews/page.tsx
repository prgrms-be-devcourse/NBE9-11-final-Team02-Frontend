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
        <span className="rating">
            {"★".repeat(filled)}
            <span style={{ color: "#dde5df" }}>{"★".repeat(Math.max(0, 5 - filled))}</span>
            <b style={{ marginLeft: 6 }}>{rating.toFixed(1)}</b>
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
            .then((res) => { if (active) setItems(res); })
            .catch((e) => {
                if (!active) return;
                setError(e instanceof ApiError ? e.message : "내 후기를 불러오지 못했습니다.");
                setItems(undefined);
            })
            .finally(() => { if (active) setLoading(false); });

        return () => { active = false; };
    }, [user]);

    return (
        <main className="flow-page">
            <div className="flow-shell records-shell">
                <Link href="/mypage" className="flow-back">← 마이페이지</Link>
                <div className="flow-heading">
                    <span>MY REVIEWS</span>
                    <h1>내가 쓴 시설 후기</h1>
                    <p>완료된 매치에서 작성한 경기장 후기예요.</p>
                </div>

                {loading ? (
                    <div className="auth-loading" style={{ minHeight: "30vh" }}><span className="auth-spinner" /></div>
                ) : error ? (
                    <div className="manager-empty">
                        <span>!</span>
                        <h2>후기를 불러오지 못했습니다.</h2>
                        <p>{error}</p>
                    </div>
                ) : !items || items.length === 0 ? (
                    <div className="manager-empty">
                        <span>✍</span>
                        <h2>아직 작성한 시설 후기가 없습니다.</h2>
                        <p>완료된 매치에서 후기를 남겨보세요.</p>
                        <Link href="/mypage/matches">내 매치 보기</Link>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {items.map((review) => (
                            <div key={review.reviewId} className="review-panel">
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                                    <Stars rating={review.rating} />
                                    <span style={{ fontSize: 10, color: "var(--muted)" }}>{formatDate(review.createdAt)}</span>
                                </div>
                                {review.comment ? (
                                    <p style={{ marginTop: 10, fontSize: 13, color: "var(--ink)", lineHeight: 1.7 }}>{review.comment}</p>
                                ) : null}
                                <Link
                                    href={`/facilities/${review.facilityId}`}
                                    style={{ display: "inline-block", marginTop: 12, fontSize: 11, fontWeight: 800, color: "var(--green)" }}
                                >
                                    경기장 보기 →
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
