"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Select } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/http";
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
    const { user, loading: authLoading } = useAuth();

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
            .then((res) => {
                if (active) setData(res);
            })
            .catch((err) => {
                if (!active) return;
                setError(
                    err instanceof ApiError
                        ? err.message
                        : "매치 목록을 불러오지 못했습니다.",
                );
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, [user, sportType, myMatchStatus, role, page]);

    if (authLoading || !user) {
        return (
            <main className="flex flex-1 items-center justify-center bg-zinc-50">
                <p className="text-sm text-zinc-400">불러오는 중…</p>
            </main>
        );
    }

    return (
        <main className="flex flex-1 flex-col items-center bg-zinc-50 px-4 py-12">
            <div className="w-full max-w-3xl">
                <div className="mb-6 flex items-center justify-between">
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
                        내 매치 목록
                    </h1>
                    <Link
                        href="/mypage"
                        className="text-sm text-zinc-500 underline-offset-4 hover:underline"
                    >
                        마이페이지로
                    </Link>
                </div>

                <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:flex-row">
                    <div className="flex-1">
                        <label className="mb-1.5 block text-xs font-medium text-zinc-500">
                            종목
                        </label>
                        <Select
                            value={sportType}
                            onChange={(e) => {
                                setSportType(e.target.value as SportType | "");
                                setPage(0);
                            }}
                        >
                            <option value="">전체</option>
                            {Object.entries(SPORT_TYPE_LABEL).map(([value, label]) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            ))}
                        </Select>
                    </div>
                    <div className="flex-1">
                        <label className="mb-1.5 block text-xs font-medium text-zinc-500">
                            상태
                        </label>
                        <Select
                            value={myMatchStatus}
                            onChange={(e) => {
                                setMyMatchStatus(e.target.value as MyMatchStatus | "");
                                setPage(0);
                            }}
                        >
                            <option value="">전체</option>
                            {Object.entries(MATCH_STATUS_LABEL).map(([value, label]) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            ))}
                        </Select>
                    </div>
                    <div className="flex-1">
                        <label className="mb-1.5 block text-xs font-medium text-zinc-500">
                            역할
                        </label>
                        <Select
                            value={role}
                            onChange={(e) => {
                                setRole(e.target.value as MatchParticipantRole | "");
                                setPage(0);
                            }}
                        >
                            <option value="">전체</option>
                            {Object.entries(ROLE_LABEL).map(([value, label]) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            ))}
                        </Select>
                    </div>
                </div>

                {loading ? (
                    <p className="py-12 text-center text-sm text-zinc-400">불러오는 중…</p>
                ) : error ? (
                    <p className="py-12 text-center text-sm text-red-600">{error}</p>
                ) : !data || data.content.length === 0 ? (
                    <p className="py-12 text-center text-sm text-zinc-400">
                        참여한 매치가 없습니다.
                    </p>
                ) : (
                    <>
                        <div className="flex flex-col gap-3">
                            {data.content.map((match) => (
                                <MatchCard
                                    key={match.matchId}
                                    match={match}
                                    expanded={expandedMatchId === match.matchId}
                                    onToggle={() =>
                                        setExpandedMatchId((prev) =>
                                            prev === match.matchId ? undefined : match.matchId,
                                        )
                                    }
                                />
                            ))}
                        </div>

                        <Pagination
                            page={data.number}
                            totalPages={data.totalPages}
                            onChange={setPage}
                        />
                    </>
                )}
            </div>
        </main>
    );
}

function MatchCard({
                       match,
                       expanded,
                       onToggle,
                   }: {
    match: MyMatchResponse;
    expanded: boolean;
    onToggle: () => void;
}) {
    return (
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <button
                type="button"
                onClick={onToggle}
                className="flex w-full items-center justify-between text-left"
            >
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <h2 className="font-semibold text-zinc-900">{match.title}</h2>
                        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
              {SPORT_TYPE_LABEL[match.sportType]}
            </span>
                        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
              {ROLE_LABEL[match.role]}
            </span>
                    </div>
                    <p className="text-sm text-zinc-500">
                        {match.matchDate} {match.startTime.slice(0, 5)} ~{" "}
                        {match.endTime.slice(0, 5)}
                    </p>
                </div>
                <span
                    className={
                        match.myMatchStatus === "PARTICIPATING"
                            ? "rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700"
                            : match.myMatchStatus === "COMPLETED"
                                ? "rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600"
                                : "rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700"
                    }
                >
          {MATCH_STATUS_LABEL[match.myMatchStatus]}
        </span>
            </button>

            {expanded ? <MatchPaymentDetail matchId={match.matchId} /> : null}
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
            .then((res) => {
                if (active) setPayment(res);
            })
            .catch((err) => {
                if (!active) return;
                setError(
                    err instanceof ApiError
                        ? err.message
                        : "결제 내역을 불러오지 못했습니다.",
                );
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, [matchId]);

    if (loading) {
        return (
            <p className="mt-4 border-t border-zinc-100 pt-4 text-sm text-zinc-400">
                결제 내역 불러오는 중…
            </p>
        );
    }

    if (error || !payment) {
        return (
            <p className="mt-4 border-t border-zinc-100 pt-4 text-sm text-red-600">
                {error ?? "결제 내역이 없습니다."}
            </p>
        );
    }

    return (
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-zinc-100 pt-4 text-sm">
            {payment.hostDetail ? (
                <>
                    <PaymentItem
                        label="시설 결제 금액"
                        value={`${payment.hostDetail.facilityPaymentAmount.toLocaleString()}원`}
                    />
                    <PaymentItem
                        label="결제 상태"
                        value={PAYMENT_STATUS_LABEL[payment.hostDetail.facilityPaymentStatus]}
                    />
                    <PaymentItem
                        label="정산 금액"
                        value={
                            payment.hostDetail.hostSettlementAmount != null
                                ? `${payment.hostDetail.hostSettlementAmount.toLocaleString()}원`
                                : "-"
                        }
                    />
                    <PaymentItem
                        label="정산 상태"
                        value={
                            payment.hostDetail.settlementStatus
                                ? SETTLEMENT_STATUS_LABEL[payment.hostDetail.settlementStatus]
                                : "-"
                        }
                    />
                </>
            ) : null}

            {payment.participantDetail ? (
                <>
                    <PaymentItem
                        label="참가비"
                        value={`${payment.participantDetail.amount.toLocaleString()}원`}
                    />
                    <PaymentItem
                        label="결제 상태"
                        value={PAYMENT_STATUS_LABEL[payment.participantDetail.status]}
                    />
                </>
            ) : null}
        </dl>
    );
}

function PaymentItem({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex flex-col gap-0.5">
            <dt className="text-xs text-zinc-500">{label}</dt>
            <dd className="font-medium text-zinc-900">{value}</dd>
        </div>
    );
}

function Pagination({
                        page,
                        totalPages,
                        onChange,
                    }: {
    page: number;
    totalPages: number;
    onChange: (page: number) => void;
}) {
    if (totalPages <= 1) return null;

    return (
        <div className="mt-8 flex items-center justify-center gap-2">
            <button
                type="button"
                disabled={page === 0}
                onClick={() => onChange(page - 1)}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
                이전
            </button>
            <span className="text-sm text-zinc-600">
        {page + 1} / {totalPages}
      </span>
            <button
                type="button"
                disabled={page >= totalPages - 1}
                onClick={() => onChange(page + 1)}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
                다음
            </button>
        </div>
    );
}