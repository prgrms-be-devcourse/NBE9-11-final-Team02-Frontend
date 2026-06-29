"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Select } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/http";
import { calculateParticipantCancelDeadline, formatPolicyDateTime, parseSlotStartAt } from "@/lib/match-policy";
import { getMatchPayment, getMyMatches } from "@/lib/mypage-match";
import type {
    MatchParticipantRole,
    MatchPaymentResponse,
    MyMatchResponse,
    MyMatchStatus,
    PageResponse,
    SportType,
} from "@/lib/types";

const SPORT_TYPE_LABEL: Record<SportType, string> = {
    FUTSAL: "풋살",
    SOCCER: "축구",
    BASKETBALL: "농구",
    TENNIS: "테니스",
    BADMINTON: "배드민턴",
};

const MATCH_STATUS_LABEL: Record<MyMatchStatus, string> = {
    PARTICIPATING: "참여 중",
    COMPLETED: "완료",
    CANCELLED: "취소됨",
};

const ROLE_LABEL: Record<MatchParticipantRole, string> = {
    HOST: "주최자",
    PARTICIPANT: "참가자",
};

const PAYMENT_STATUS_LABEL: Record<string, string> = {
    PENDING: "결제 대기",
    PAID: "결제 완료",
    FAILED: "결제 실패",
    REFUNDED: "환불됨",
};

const SETTLEMENT_STATUS_LABEL: Record<string, string> = {
    HOLDING: "정산 대기",
    SETTLED: "정산 완료",
    FAILED: "정산 실패",
};

const PAGE_SIZE = 10;

export default function MyMatchesPage() {
    const router = useRouter();
    const search = useSearchParams();
    const { user, loading: authLoading } = useAuth();
    const hostPaymentSuccess = search.get("payment") === "host-success";

    const [sportType, setSportType] = useState<SportType | "">("");
    const [myMatchStatus, setMyMatchStatus] = useState<MyMatchStatus | "">("");
    const [role, setRole] = useState<MatchParticipantRole | "">("");
    const [page, setPage] = useState(0);

    const [data, setData] = useState<PageResponse<MyMatchResponse>>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>();
    const [expandedMatchId, setExpandedMatchId] = useState<string>();

    useEffect(() => {
        if (!authLoading && !user) {
            router.replace("/login?next=/mypage/matches");
        }
    }, [authLoading, user, router]);

    useEffect(() => {
        if (!user) return;

        let active = true;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLoading(true);
        setError(undefined);

        getMyMatches({
            sportType: sportType || undefined,
            myMatchStatus: myMatchStatus || undefined,
            role: role || undefined,
            page,
            size: PAGE_SIZE,
        })
            .then((res) => { if (active) setData(res); })
            .catch((err) => {
                if (!active) return;
                setError(err instanceof ApiError ? err.message : "매치 목록을 불러오지 못했습니다.");
            })
            .finally(() => { if (active) setLoading(false); });

        return () => { active = false; };
    }, [user, sportType, myMatchStatus, role, page]);

    if (authLoading || !user) {
        return <main className="auth-loading"><span className="auth-spinner" /></main>;
    }

    return (
        <main className="flow-page">
            <div className="flow-shell" style={{ maxWidth: 760 }}>
                <Link href="/mypage" className="flow-back">← 마이페이지</Link>
                <div className="flow-heading">
                    <span>MY MATCHES</span>
                    <h1>내 매치 목록</h1>
                    <p>참가하거나 주최한 매치를 확인하세요.</p>
                </div>

                {hostPaymentSuccess ? (
                    <div className="policy-notice" style={{ marginBottom: 18 }}>
                        <b>방장 결제가 완료되었습니다.</b>
                        <p>생성한 매치가 내 매치 목록에 반영되었습니다.</p>
                    </div>
                ) : null}

                <div className="reservation-filter">
                    <label>
                        <span style={{ display: "block", fontSize: 10, color: "var(--muted)", fontWeight: 800, marginBottom: 6 }}>종목</span>
                        <Select value={sportType} onChange={(e) => { setSportType(e.target.value as SportType | ""); setPage(0); }}>
                            <option value="">전체</option>
                            {Object.entries(SPORT_TYPE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </Select>
                    </label>
                    <label>
                        <span style={{ display: "block", fontSize: 10, color: "var(--muted)", fontWeight: 800, marginBottom: 6 }}>상태</span>
                        <Select value={myMatchStatus} onChange={(e) => { setMyMatchStatus(e.target.value as MyMatchStatus | ""); setPage(0); }}>
                            <option value="">전체</option>
                            {Object.entries(MATCH_STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </Select>
                    </label>
                    <label>
                        <span style={{ display: "block", fontSize: 10, color: "var(--muted)", fontWeight: 800, marginBottom: 6 }}>역할</span>
                        <Select value={role} onChange={(e) => { setRole(e.target.value as MatchParticipantRole | ""); setPage(0); }}>
                            <option value="">전체</option>
                            {Object.entries(ROLE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </Select>
                    </label>
                </div>

                {loading ? (
                    <div className="auth-loading" style={{ minHeight: "30vh" }}><span className="auth-spinner" /></div>
                ) : error ? (
                    <div className="manager-empty">
                        <span>!</span>
                        <h2>매치 목록을 불러오지 못했습니다.</h2>
                        <p>{error}</p>
                    </div>
                ) : !data || data.content.length === 0 ? (
                    <div className="manager-empty">
                        <span>⌕</span>
                        <h2>참여한 매치가 없습니다.</h2>
                        <p>필터를 바꿔서 다시 조회해보세요.</p>
                    </div>
                ) : (
                    <>
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            {data.content.map((match) => (
                                <MatchCard
                                    key={match.matchId}
                                    match={match}
                                    expanded={expandedMatchId === match.matchId}
                                    onOpen={() => router.push(`/matches/${match.matchId}`)}
                                    onTogglePayment={() =>
                                        setExpandedMatchId((prev) =>
                                            prev === match.matchId ? undefined : match.matchId,
                                        )
                                    }
                                />
                            ))}
                        </div>
                        <Pagination page={data.number} totalPages={data.totalPages} onChange={setPage} />
                    </>
                )}
            </div>
        </main>
    );
}

function MatchCard({
    match,
    expanded,
    onOpen,
    onTogglePayment,
}: {
    match: MyMatchResponse;
    expanded: boolean;
    onOpen: () => void;
    onTogglePayment: () => void;
}) {
    const startAt = parseSlotStartAt(match.matchDate, match.startTime);
    const participantCancelDeadline = startAt ? calculateParticipantCancelDeadline(startAt) : null;

    const statusClass =
        match.myMatchStatus === "PARTICIPATING" ? "pill green" :
        match.myMatchStatus === "COMPLETED" ? "pill" : "pill red";

    return (
        <div className="record-panel" style={{ marginBottom: 0 }}>
            <button type="button" onClick={onOpen} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", background: "none", border: 0, padding: 0, cursor: "pointer", textAlign: "left" }}>
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                        <b style={{ fontSize: 14 }}>{match.title}</b>
                        <span className="pill" style={{ background: "#f0f2f0", color: "#66736e" }}>{SPORT_TYPE_LABEL[match.sportType]}</span>
                        <span className="pill" style={{ background: "#f0f2f0", color: "#66736e" }}>{ROLE_LABEL[match.role]}</span>
                    </div>
                    <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>
                        {match.matchDate} {match.startTime.slice(0, 5)} ~ {match.endTime.slice(0, 5)}
                    </p>
                    {match.myMatchStatus === "PARTICIPATING" ? (
                        <p style={{ fontSize: 11, color: "var(--green)", margin: "4px 0 0" }}>
                            취소 가능 마감: {formatPolicyDateTime(participantCancelDeadline)} · 마감 전 전액 환불
                        </p>
                    ) : null}
                </div>
                <span className={statusClass}>{MATCH_STATUS_LABEL[match.myMatchStatus]}</span>
            </button>

            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button
                    type="button"
                    onClick={onTogglePayment}
                    style={{ padding: "8px 10px", border: "1px solid var(--line)", borderRadius: 7, background: "#fff", fontSize: 12, fontWeight: 800, color: "var(--text)", cursor: "pointer" }}
                >
                    {expanded ? "결제 내역 접기" : "결제 내역 보기"}
                </button>
            </div>

            {expanded ? <MatchPaymentDetail matchId={match.matchId} /> : null}
            {match.myMatchStatus === "COMPLETED" ? (
                <Link
                    href={`/matches/${match.matchId}/review`}
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", marginTop: 12, padding: "10px", border: "1px solid #bfe2cd", borderRadius: 7, background: "#e8f5ed", fontSize: 12, fontWeight: 800, color: "var(--green)" }}
                >
                    리뷰 작성하기
                </Link>
            ) : null}
        </div>
    );
}

function MatchPaymentDetail({ matchId }: { matchId: string }) {
    const [payment, setPayment] = useState<MatchPaymentResponse>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>();

    useEffect(() => {
        let active = true;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLoading(true);
        setError(undefined);

        getMatchPayment(matchId)
            .then((res) => { if (active) setPayment(res); })
            .catch((err) => {
                if (!active) return;
                setError(err instanceof ApiError ? err.message : "결제 내역을 불러오지 못했습니다.");
            })
            .finally(() => { if (active) setLoading(false); });

        return () => { active = false; };
    }, [matchId]);

    if (loading) return <p style={{ marginTop: 14, borderTop: "1px solid var(--line)", paddingTop: 14, fontSize: 12, color: "var(--muted)" }}>결제 내역 불러오는 중…</p>;
    if (error || !payment) return <p style={{ marginTop: 14, borderTop: "1px solid var(--line)", paddingTop: 14, fontSize: 12, color: "var(--coral)" }}>{error ?? "결제 내역이 없습니다."}</p>;

    return (
        <div className="manager-readonly" style={{ marginTop: 14, borderTop: "1px solid var(--line)", paddingTop: 14 }}>
            {payment.hostDetail ? (
                <>
                    <PaymentItem label="시설 결제 금액" value={`${payment.hostDetail.facilityPaymentAmount.toLocaleString()}원`} />
                    <PaymentItem label="결제 상태" value={PAYMENT_STATUS_LABEL[payment.hostDetail.facilityPaymentStatus]} />
                    <PaymentItem label="환불 사유" value={payment.hostDetail.refundReason ?? "-"} />
                    <PaymentItem label="정산 금액" value={payment.hostDetail.hostSettlementAmount != null ? `${payment.hostDetail.hostSettlementAmount.toLocaleString()}원` : "-"} />
                    <PaymentItem label="정산 상태" value={payment.hostDetail.settlementStatus ? SETTLEMENT_STATUS_LABEL[payment.hostDetail.settlementStatus] : "-"} />
                </>
            ) : null}
            {payment.participantDetail ? (
                <>
                    <PaymentItem label="참가비" value={`${payment.participantDetail.amount.toLocaleString()}원`} />
                    <PaymentItem label="결제 상태" value={PAYMENT_STATUS_LABEL[payment.participantDetail.status]} />
                    <PaymentItem label="환불 사유" value={payment.participantDetail.refundReason ?? "-"} />
                </>
            ) : null}
        </div>
    );
}

function PaymentItem({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <span>{label}</span>
            <b>{value}</b>
        </div>
    );
}

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (page: number) => void }) {
    if (totalPages <= 1) return null;
    return (
        <div className="pagination">
            <button type="button" disabled={page === 0} onClick={() => onChange(page - 1)}>이전</button>
            <span>{page + 1} / {totalPages}</span>
            <button type="button" disabled={page >= totalPages - 1} onClick={() => onChange(page + 1)}>다음</button>
        </div>
    );
}
