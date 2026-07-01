"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, FormError } from "@/components/ui";
import { StarRating } from "@/components/star-rating";
import { RequireAuth } from "@/components/require-auth";
import { useAuth } from "@/lib/auth-context";
import { getMatchParticipants } from "@/lib/match";
import { submitReview } from "@/lib/user-service";
import type { MatchParticipantResponse } from "@/lib/types";

export default function ReviewPage() {
    return <RequireAuth><ReviewForm /></RequireAuth>;
}

function ReviewForm() {
    const { matchId } = useParams<{ matchId: string }>();
    const router = useRouter();
    const { user } = useAuth();

    const [people, setPeople] = useState<MatchParticipantResponse[]>([]);
    const [facilityRating, setFacilityRating] = useState<number | null>(null);
    const [comment, setComment] = useState("");
    const [ratings, setRatings] = useState<Record<string, { manner: number | null; skill: number | null }>>({});
    const [error, setError] = useState<string>();
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        let active = true;
        getMatchParticipants(matchId)
            .then((data) => { if (active) setPeople(data.filter((v) => v.userId !== user?.userId)); })
            .catch((e) => { if (active) setError(e instanceof Error ? e.message : "참가자를 불러오지 못했습니다."); });
        return () => { active = false; };
    }, [matchId, user?.userId]);

    async function save() {
        if (!user) return;
        setSaving(true);
        setError(undefined);
        try {
            await submitReview(matchId, user.userId, {
                facilityReview: facilityRating != null ? { rating: facilityRating, comment } : null,
                participantReviews: people
                    .map((person) => {
                        const r = ratings[person.userId];
                        if (r?.manner == null || r?.skill == null) return null;
                        return {
                            revieweeId: person.userId,
                            mannerRating: r.manner,
                            skillRating: r.skill,
                        };
                    })
                    .filter((v): v is { revieweeId: string; mannerRating: number; skillRating: number } => v !== null),
            });
            router.replace("/mypage/matches");
        } catch (e) {
            setError(e instanceof Error ? e.message : "리뷰를 등록하지 못했습니다.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <main className="flow-page">
            <div className="flow-shell">
                <div className="flow-heading">
                    <span>AFTER MATCH</span>
                    <h1>오늘 경기는 어떠셨나요?</h1>
                    <p>경기장과 함께한 플레이어에게 리뷰를 남겨주세요.</p>
                </div>

                <FormError message={error} />

                <section className="review-panel">
                    <h2>경기장 평가</h2>
                    <StarRating value={facilityRating} onChange={setFacilityRating} />
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        maxLength={500}
                        placeholder="경기장 이용 경험을 알려주세요."
                    />
                </section>

                <section className="review-panel">
                    <h2>함께한 플레이어</h2>
                    {people.length === 0 ? (
                        <p className="record-empty">평가할 참가자가 없습니다.</p>
                    ) : (
                        people.map((person) => (
                            <div className="participant-review" key={person.participantId}>
                                <div>
                                    <b>{person.nickname || "알 수 없음"}</b>
                                    <small>{person.role === "HOST" ? "매치 호스트" : "참가자"}</small>
                                </div>
                                <label>
                                    <span style={{ display: "block", marginBottom: 6 }}>매너</span>
                                    <StarRating
                                        value={ratings[person.userId]?.manner ?? null}
                                        onChange={(v) =>
                                            setRatings((cur) => ({
                                                ...cur,
                                                [person.userId]: { ...cur[person.userId], manner: v },
                                            }))
                                        }
                                    />
                                </label>
                                <label>
                                    <span style={{ display: "block", marginBottom: 6 }}>실력</span>
                                    <StarRating
                                        value={ratings[person.userId]?.skill ?? null}
                                        onChange={(v) =>
                                            setRatings((cur) => ({
                                                ...cur,
                                                [person.userId]: { ...cur[person.userId], skill: v },
                                            }))
                                        }
                                    />
                                </label>
                            </div>
                        ))
                    )}
                </section>

                <Button type="button" loading={saving} onClick={save}>
                    리뷰 등록하기
                </Button>
            </div>
        </main>
    );
}
