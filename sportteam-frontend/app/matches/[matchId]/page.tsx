"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/http";
import {
    cancelMatch,
    getMatch,
    getMatchParticipants,
    joinMatch,
    leaveMatch,
} from "@/lib/match";
import {
    calculateHostCancelDeadline,
    inferMatchStartAtFromCancelDeadline,
    isBeforeNow,
} from "@/lib/match-policy";
import {
    MATCH_STATUS_LABEL,
    REQUIRED_GENDER_LABEL,
    SPORT_TYPE_LABEL,
    formatSkillRange,
} from "@/lib/match-labels";
import type {
    MatchDetailResponse,
    MatchParticipantResponse,
} from "@/lib/types";

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
    const [participants, setParticipants] = useState<MatchParticipantResponse[]>(
        [],
    );
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
        <main className="flex flex-1 flex-col items-center bg-zinc-50 px-4 py-12">
            <div className="w-full max-w-2xl">
                <Link
                    href="/matches"
                    className="mb-6 inline-block text-sm text-zinc-500 underline-offset-4 hover:underline"
                >
                    ← 목록으로
                </Link>

                {loading ? (
                    <p className="py-12 text-center text-sm text-zinc-400">불러오는 중…</p>
                ) : error || !match ? (
                    <p className="py-12 text-center text-sm text-red-600">
                        {error ?? "매치 정보를 찾을 수 없습니다."}
                    </p>
                ) : (
                    <>
                        <MatchInfo match={match} />
                        <ParticipantList
                            participants={participants}
                            hostId={match.hostId}
                        />
                        <MatchActions
                            match={match}
                            currentUserId={user?.userId}
                            participants={participants}
                            onChanged={load}
                        />
                    </>
                )}
            </div>
        </main>
    );
}

function MatchInfo({ match }: { match: MatchDetailResponse }) {
    const full = match.currentCount >= match.capacity;

    return (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-start justify-between gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
                    {match.title}
                </h1>
                <span
                    className={
                        match.status === "RECRUITING"
                            ? "shrink-0 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700"
                            : "shrink-0 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600"
                    }
                >
          {MATCH_STATUS_LABEL[match.status]}
        </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
          {SPORT_TYPE_LABEL[match.sportType]}
        </span>
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
          {REQUIRED_GENDER_LABEL[match.requiredGender]}
        </span>
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
          {formatSkillRange(match.minSkillLevel, match.maxSkillLevel)}
        </span>
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-zinc-100 pt-6 text-sm">
                <InfoItem
                    label="모집 현황"
                    value={`${match.currentCount} / ${match.capacity}명`}
                    highlight={full}
                />
                <InfoItem
                    label="참가비"
                    value={`${match.feePerPerson.toLocaleString()}원`}
                />
                <InfoItem
                    label="모집 마감"
                    value={formatDateTime(match.recruitDeadline)}
                />
                <InfoItem
                    label="취소 마감"
                    value={formatDateTime(match.cancelDeadline)}
                />
                {match.confirmedAt ? (
                    <InfoItem label="확정 시각" value={formatDateTime(match.confirmedAt)} />
                ) : null}
                {match.cancelledAt ? (
                    <InfoItem label="취소 시각" value={formatDateTime(match.cancelledAt)} />
                ) : null}
            </dl>
        </div>
    );
}

function InfoItem({
                      label,
                      value,
                      highlight,
                  }: {
    label: string;
    value: string;
    highlight?: boolean;
}) {
    return (
        <div className="flex flex-col gap-0.5">
            <dt className="text-xs text-zinc-500">{label}</dt>
            <dd
                className={
                    highlight ? "font-medium text-red-600" : "font-medium text-zinc-900"
                }
            >
                {value}
            </dd>
        </div>
    );
}

function ParticipantList({
                             participants,
                             hostId,
                         }: {
    participants: MatchParticipantResponse[];
    hostId: string;
}) {
    const active = participants.filter((p) => p.status === "ACTIVE");

    return (
        <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="mb-4 text-lg font-semibold text-zinc-900">
                참가자 ({active.length}명)
            </h2>
            {active.length === 0 ? (
                <p className="text-sm text-zinc-400">아직 참가자가 없습니다.</p>
            ) : (
                <ul className="flex flex-col gap-2">
                    {active.map((p) => (
                        <li
                            key={p.participantId}
                            className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2.5 text-sm"
                        >
              <span className="font-medium text-zinc-900">
                {p.userId === hostId ? "주최자" : "참가자"}
              </span>
                            <span className="text-xs text-zinc-400">
                {p.userId.slice(0, 8)}…
              </span>
                        </li>
                    ))}
                </ul>
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
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string>();

    // 로그인하지 않은 경우
    if (!currentUserId) {
        return (
            <div className="mt-6">
                <Link
                    href={`/login?next=/matches/${match.matchId}`}
                    className="inline-flex w-full items-center justify-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
                >
                    로그인하고 참여하기
                </Link>
            </div>
        );
    }

    const isHost = match.hostId === currentUserId;
    const myActive = participants.some(
        (p) => p.userId === currentUserId && p.status === "ACTIVE",
    );
    const full = match.currentCount >= match.capacity;
    const recruiting = match.status === "RECRUITING";
    const cancellableStatus = match.status === "RECRUITING" || match.status === "CONFIRMED";
    const matchStartAt = inferMatchStartAtFromCancelDeadline(match.cancelDeadline);
    const participantCancelClosed = isBeforeNow(match.cancelDeadline);
    const hostCancelDeadline = matchStartAt ? calculateHostCancelDeadline(matchStartAt) : null;
    const hostCancelClosed = isBeforeNow(hostCancelDeadline);

    async function run(action: () => Promise<unknown>, fallbackMsg: string) {
        setSubmitting(true);
        setError(undefined);
        try {
            await action();
            await onChanged();
        } catch (err) {
            setError(err instanceof ApiError ? err.message : fallbackMsg);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="mt-6 flex flex-col gap-3">
            {error ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                    {error}
                </div>
            ) : null}

            {isHost ? (
                <div className="flex flex-col gap-2">
                    <p className="rounded-lg bg-zinc-100 px-4 py-3 text-center text-sm text-zinc-600">
                        내가 주최한 매치입니다.
                    </p>
                    <Button
                        type="button"
                        loading={submitting}
                        disabled={!cancellableStatus || hostCancelClosed}
                        onClick={() => {
                            if (!window.confirm("매치를 취소하면 참가자 전원에게 전액 환불 요청이 진행됩니다. 취소할까요?")) return;
                            void run(
                                () => cancelMatch(match.matchId),
                                "매치 취소에 실패했습니다.",
                            );
                        }}
                        className="bg-white text-red-600 ring-1 ring-inset ring-red-300 hover:bg-red-50"
                    >
                        {hostCancelClosed ? "방장 취소 마감" : "매치 취소"}
                    </Button>
                </div>
            ) : myActive ? (
                <div className="flex flex-col gap-2">
                    <p className="rounded-lg bg-emerald-50 px-4 py-3 text-center text-sm text-emerald-700">
                        참가자 이탈은 경기 시작 24시간 전까지 가능하며 전액 환불됩니다.
                    </p>
                    <Button
                        type="button"
                        loading={submitting}
                        disabled={participantCancelClosed}
                        onClick={() =>
                            run(
                                () => leaveMatch(match.matchId),
                                "참여 취소에 실패했습니다.",
                            )
                        }
                        className="bg-white text-red-600 ring-1 ring-inset ring-red-300 hover:bg-red-50"
                    >
                        {participantCancelClosed ? "참여 취소 마감" : "참여 취소 · 전액 환불"}
                    </Button>
                </div>
            ) : !recruiting ? (
                <p className="rounded-lg bg-zinc-100 px-4 py-3 text-center text-sm text-zinc-500">
                    모집이 마감된 매치입니다.
                </p>
            ) : full ? (
                <p className="rounded-lg bg-zinc-100 px-4 py-3 text-center text-sm text-zinc-500">
                    정원이 가득 찼습니다.
                </p>
            ) : (
                <Button
                    type="button"
                    loading={submitting}
                    onClick={() =>
                        run(async () => {
                            await joinMatch(match.matchId);
                            router.refresh();
                        }, "매치 참여에 실패했습니다.")
                    }
                >
                    매치 참여하기
                </Button>
            )}
        </div>
    );
}
