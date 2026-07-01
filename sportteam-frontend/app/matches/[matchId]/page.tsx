"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/http";
import { confirmPayment, prepareParticipationPayment, requestTossPayment } from "@/lib/payment";
import {
    cancelMatch,
    confirmMatch,
    getMatch,
    getMatchParticipants,
    joinMatch,
    leaveMatch,
} from "@/lib/match";
import { isBeforeNow } from "@/lib/match-policy";
import {
    MATCH_STATUS_LABEL,
    REQUIRED_GENDER_LABEL,
    SPORT_TYPE_LABEL,
    formatSkillRange,
} from "@/lib/match-labels";
import type {
    MatchDetailResponse,
    MatchParticipantResponse,
    SportType,
} from "@/lib/types";

const SPORT_ICON: Record<SportType, string> = {
    FUTSAL: "🥅",
    SOCCER: "⚽",
    BASKETBALL: "🏀",
    TENNIS: "🎾",
    BADMINTON: "🏸",
};

function formatDateTime(iso: string | null): string {
    if (!iso) return "-";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function MatchDetailPage() {
    const params = useParams<{ matchId: string }>();
    const matchId = params.matchId;
    const { user } = useAuth();

    const [match, setMatch] = useState<MatchDetailResponse>();
    const [participants, setParticipants] = useState<MatchParticipantResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>();

    const load = useCallback(async () => {
        const [detail, parts] = await Promise.all([
            getMatch(matchId),
            getMatchParticipants(matchId),
        ]);
        setMatch(detail);
        setParticipants(parts);
    }, [matchId]);

    useEffect(() => {
        let active = true;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLoading(true);
        setError(undefined);

        load()
            .catch((err) => {
                if (!active) return;
                setError(
                    err instanceof ApiError
                        ? err.message
                        : "매치 정보를 불러오지 못했습니다.",
                );
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, [load]);

    return (
        <main className="detail-page">
            <div className="container">
                <div className="detail-breadcrumb">
                    <Link href="/matches">매치 찾기</Link>
                    <span>/</span>
                    <b>{match ? match.title : "매치 상세"}</b>
                </div>

                {loading ? (
                    <div className="auth-loading">
                        <span className="auth-spinner" />
                    </div>
                ) : error || !match ? (
                    <div className="manager-empty">
                        <span>!</span>
                        <h2>매치 정보를 찾을 수 없습니다.</h2>
                        <p>{error ?? "잠시 후 다시 시도해주세요."}</p>
                    </div>
                ) : (
                    <div className="detail-layout">
                        <div className="detail-main">
                            <MatchHeading match={match} />
                            <div className="detail-art">
                                <i />
                                <i />
                                <span>{SPORT_ICON[match.sportType] ?? "🏃"}</span>
                            </div>
                            <MatchInfoSection match={match} />
                            <ParticipantSection
                                participants={participants}
                                hostId={match.hostId}
                            />
                        </div>
                        <MatchActions
                            match={match}
                            currentUserId={user?.userId}
                            participants={participants}
                            onChanged={load}
                        />
                    </div>
                )}
            </div>
        </main>
    );
}

function MatchHeading({ match }: { match: MatchDetailResponse }) {
    return (
        <div className="detail-heading">
            <div>
                <span className="detail-status">{MATCH_STATUS_LABEL[match.status]}</span>
                <span className="detail-sport">{SPORT_TYPE_LABEL[match.sportType]}</span>
                <span className="detail-sport">
                    {REQUIRED_GENDER_LABEL[match.requiredGender]}
                </span>
                <span className="detail-sport">
                    {formatSkillRange(match.minSkillLevel, match.maxSkillLevel)}
                </span>
            </div>
            <h1>{match.title}</h1>
            <p>모집 마감 {formatDateTime(match.recruitDeadline)}</p>
        </div>
    );
}

function MatchInfoSection({ match }: { match: MatchDetailResponse }) {
    return (
        <div className="detail-section">
            <h2>매치 정보</h2>
            <div className="info-grid">
                <div>
                    <span>경기장</span>
                    <b>{match.facilityName || "-"}</b>
                </div>
                <div>
                    <span>주소</span>
                    <b>{match.facilityAddress || "-"}</b>
                </div>
                <div>
                    <span>주최자</span>
                    <b>{match.hostNickname || "알 수 없음"}</b>
                </div>
                <div>
                    <span>모집 현황</span>
                    <b>
                        {match.currentCount} / {match.capacity}명
                    </b>
                </div>
                <div>
                    <span>참가비</span>
                    <b>{match.feePerPerson.toLocaleString()}원</b>
                </div>
                <div>
                    <span>모집 마감</span>
                    <b>{formatDateTime(match.recruitDeadline)}</b>
                </div>
                <div>
                    <span>참가 취소 마감</span>
                    <b>{formatDateTime(match.participantCancelDeadline)}</b>
                </div>
                <div>
                    <span>방장 취소 마감</span>
                    <b>{formatDateTime(match.hostCancelDeadline)}</b>
                </div>
                {match.confirmedAt ? (
                    <div>
                        <span>확정 시각</span>
                        <b>{formatDateTime(match.confirmedAt)}</b>
                    </div>
                ) : null}
                {match.cancelledAt ? (
                    <div>
                        <span>취소 시각</span>
                        <b>{formatDateTime(match.cancelledAt)}</b>
                    </div>
                ) : null}
            </div>
        </div>
    );
}

function ParticipantSection({
                                participants,
                                hostId,
                            }: {
    participants: MatchParticipantResponse[];
    hostId: string;
}) {
    const active = participants.filter((p) => p.status === "ACTIVE");

    return (
        <div className="detail-section">
            <h2>참가자 ({active.length}명)</h2>
            {active.length === 0 ? (
                <p style={{ fontSize: "12px", color: "#939c98" }}>
                    아직 참가자가 없습니다.
                </p>
            ) : (
                <div className="participant-list">
                    {active.map((p) => (
                        <div key={p.participantId}>
                            <span>{p.userId === hostId ? "H" : "P"}</span>
                            <div>
                                <b>{p.userId === hostId ? "주최자" : "참가자"}</b>
                                <small>{p.nickname || "알 수 없음"}</small>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function MatchActions({
                          match,
                          currentUserId,
                          participants,
                          onChanged,
                      }: {
    match: MatchDetailResponse;
    currentUserId?: string;
    participants: MatchParticipantResponse[];
    onChanged: () => Promise<void>;
}) {
    const router = useRouter();
    const search = useSearchParams();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string>();
    const [message, setMessage] = useState<string>();
    const [sportStatRequired, setSportStatRequired] = useState(false);
    const tossClientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY ?? "";

    useEffect(() => {
        if (!currentUserId) return;
        const paymentKey = search.get("paymentKey");
        const orderId = search.get("orderId");
        const amount = Number(search.get("amount") ?? 0);
        if (!paymentKey || !orderId || !amount) return;

        let active = true;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSubmitting(true);
        setError(undefined);
        confirmPayment({ userId: currentUserId, paymentKey, orderId, amount })
            .then(async () => {
                if (!active) return;
                setMessage("결제가 완료되었습니다. 참가 상태를 갱신했습니다.");
                await onChanged();
                router.replace(`/matches/${match.matchId}?payment=success`);
            })
            .catch((err) => {
                if (active) setError(err instanceof ApiError ? err.message : "결제 승인에 실패했습니다.");
            })
            .finally(() => {
                if (active) setSubmitting(false);
            });
        return () => {
            active = false;
        };
    }, [currentUserId, match.matchId, onChanged, router, search]);

    if (!currentUserId) {
        return (
            <aside className="join-card">
                <span>참가비</span>
                <strong>
                    {match.feePerPerson.toLocaleString()}
                    <small>원</small>
                </strong>
                <div className="match-actions">
                    <button
                        type="button"
                        onClick={() => router.push(`/login?next=/matches/${match.matchId}`)}
                    >
                        로그인하고 참여하기
                    </button>
                </div>
            </aside>
        );
    }

    const userId = currentUserId;
    const isHost = match.hostId === userId;
    const myActive = participants.some(
        (p) => p.userId === userId && p.status === "ACTIVE",
    );
    const myPaymentPending = participants.some(
        (p) => p.userId === currentUserId && p.status === "PAYMENT_PENDING",
    );
    const full = match.currentCount >= match.capacity;
    const recruiting = match.status === "RECRUITING";
    const cancellableStatus = match.status === "RECRUITING" || match.status === "CONFIRMED";
    const participantCancelClosed = isBeforeNow(match.participantCancelDeadline);
    const participantCanLeave = recruiting && !participantCancelClosed;
    const hostCancelClosed = isBeforeNow(match.hostCancelDeadline);
    const pct = match.capacity > 0
        ? Math.min(100, Math.round((match.currentCount / match.capacity) * 100))
        : 0;

    async function run(action: () => Promise<unknown>, fallbackMsg: string) {
        if (submitting) return;
        setSubmitting(true);
        setError(undefined);
        setMessage(undefined);
        setSportStatRequired(false);
        try {
            await action();
            await onChanged();
        } catch (err) {
            if (err instanceof ApiError && err.code === "USER_005") {
                router.push(`/mypage/sports?requiredSport=${match.sportType}&next=${encodeURIComponent(`/matches/${match.matchId}`)}`);
                return;
            }
            setError(err instanceof ApiError ? err.message : fallbackMsg);
        } finally {
            setSubmitting(false);
        }
    }

    async function startParticipationPayment(options: { skipJoin?: boolean } = {}) {
        setSubmitting(true);
        setError(undefined);
        setMessage(undefined);
        setSportStatRequired(false);
        try {
            if (!options.skipJoin) {
                try {
                    await joinMatch(match.matchId);
                } catch (err) {
                    if (!(err instanceof ApiError && err.code === "MATCH_003")) {
                        throw err;
                    }
                }
            }

            const prepared = await prepareParticipationPayment({
                userId,
                matchId: match.matchId,
                amount: match.feePerPerson,
            });

            if (!tossClientKey) {
                setMessage(`주문서가 생성되었습니다. Toss client key 설정 후 결제를 진행하세요. 주문번호: ${prepared.merchantUid}`);
                return;
            }

            const successUrl = new URL("/checkout/success", window.location.origin);
            successUrl.searchParams.set("matchId", match.matchId);
            successUrl.searchParams.set("paymentType", "participation");

            const failUrl = new URL("/checkout/fail", window.location.origin);
            failUrl.searchParams.set("matchId", match.matchId);

            await requestTossPayment({
                clientKey: tossClientKey,
                amount: prepared.amount,
                orderId: prepared.merchantUid,
                orderName: `${match.title} 참가비`,
                successUrl: successUrl.toString(),
                failUrl: failUrl.toString(),
            });
        } catch (err) {
            if (err instanceof ApiError && err.code === "USER_005") {
                setSportStatRequired(true);
                setError(`${SPORT_TYPE_LABEL[match.sportType]} 실력을 먼저 등록해주세요.`);
                return;
            }
            setError(err instanceof ApiError ? err.message : "결제를 시작하지 못했습니다.");
        } finally {
            setSubmitting(false);
        }
    }

    function goToSportStatRegistration() {
        router.push(
            `/mypage/sports?requiredSport=${match.sportType}&next=${encodeURIComponent(`/matches/${match.matchId}`)}`,
        );
    }

    return (
        <aside className="join-card">
            <span>참가비</span>
            <strong>
                {match.feePerPerson.toLocaleString()}
                <small>원</small>
            </strong>

            <div className="join-progress">
                <div>
                    <span>모집 현황</span>
                    <span>
                        {match.currentCount}/{match.capacity}명
                    </span>
                </div>
                <i>
                    <em style={{ width: `${pct}%` }} />
                </i>
            </div>

            <div className="join-summary">
                <p>
                    <span>모집 마감</span>
                    <b>{formatDateTime(match.recruitDeadline)}</b>
                </p>
                <p>
                    <span>상태</span>
                    <b>{MATCH_STATUS_LABEL[match.status]}</b>
                </p>
            </div>

            {error ? <div className="join-error">{error}</div> : null}
            {message ? <p className="join-state ok">{message}</p> : null}
            {sportStatRequired ? (
                <div className="match-actions">
                    <button
                        type="button"
                        className="secondary"
                        disabled={submitting}
                        onClick={goToSportStatRegistration}
                    >
                        {SPORT_TYPE_LABEL[match.sportType]} 실력 등록하러 가기
                    </button>
                </div>
            ) : null}

            <div className="match-actions">
                {isHost ? (
                    <>
                        {recruiting ? (
                            <button
                                type="button"
                                disabled={submitting}
                                onClick={() => {
                                    if (!window.confirm("매치를 확정하면 모집이 마감되어 더 이상 참가 신청을 받지 않습니다. 확정할까요?")) return;
                                    void run(
                                        () => confirmMatch(match.matchId),
                                        "매치 확정에 실패했습니다.",
                                    );
                                }}
                            >
                                {submitting ? "처리 중…" : "매치 확정 · 모집 마감"}
                            </button>
                        ) : null}
                        <button
                            type="button"
                            className="secondary"
                            disabled={submitting || !cancellableStatus || hostCancelClosed}
                            onClick={() => {
                                if (!window.confirm("매치를 취소하면 참가자 전원에게 환불 요청이 진행됩니다. 취소할까요?")) return;
                                void run(
                                    () => cancelMatch(match.matchId),
                                    "매치 취소에 실패했습니다.",
                                );
                            }}
                        >
                            {hostCancelClosed ? "방장 취소 마감" : "매치 취소"}
                        </button>
                        <small>
                            {recruiting
                                ? "인원이 모이면 매치를 확정해 모집을 마감하세요."
                                : "방장 취소 마감 전까지만 취소할 수 있습니다."}
                        </small>
                    </>
                ) : myActive ? (
                    <>
                        <button
                            type="button"
                            className="secondary"
                            disabled={submitting || !participantCanLeave}
                            onClick={() =>
                                run(() => leaveMatch(match.matchId), "참여 취소에 실패했습니다.")
                            }
                        >
                            {!recruiting
                                ? "확정 후 참여 취소 불가"
                                : participantCancelClosed
                                    ? "참여 취소 마감"
                                    : "참여 취소 · 환불 요청"}
                        </button>
                        <p>
                            {recruiting
                                ? "모집 중이며 취소 마감 전까지만 이탈할 수 있습니다."
                                : "매칭 확정 이후에는 경기 진행 안정성을 위해 이탈할 수 없습니다."}
                        </p>
                    </>
                ) : myPaymentPending ? (
                    <>
                        <button
                            type="button"
                            disabled={submitting}
                            onClick={() => void startParticipationPayment({ skipJoin: true })}
                        >
                            {submitting ? "처리 중…" : "결제 이어서 완료하기"}
                        </button>
                        <p className="join-state warn">
                            결제가 아직 완료되지 않았습니다. 결제창을 닫았거나 승인 처리에 실패했을 수 있어요.
                        </p>
                    </>
                ) : !recruiting ? (
                    <p className="join-state muted">모집이 마감된 매치입니다.</p>
                ) : full ? (
                    <p className="join-state muted">정원이 모두 찼습니다.</p>
                ) : (
                    <button
                        type="button"
                        disabled={submitting}
                        onClick={() => void startParticipationPayment()}
                    >
                        {submitting ? "처리 중…" : "결제 후 매치 참여하기"}
                    </button>
                )}
            </div>
        </aside>
    );
}
