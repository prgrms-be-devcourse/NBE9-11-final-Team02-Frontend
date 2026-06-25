"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Select } from "@/components/ui";
import { ApiError } from "@/lib/http";
import { getMatches } from "@/lib/match";
import {
    MATCH_SORT_LABEL,
    MATCH_STATUS_LABEL,
    REQUIRED_GENDER_LABEL,
    SPORT_TYPE_LABEL,
    formatSkillRange,
} from "@/lib/match-labels";
import type {
    MatchSortType,
    MatchStatus,
    MatchSummaryResponse,
    PageResponse,
    SportType,
} from "@/lib/types";

const PAGE_SIZE = 12;

export default function MatchesPage() {
    const [sportType, setSportType] = useState<SportType | "">("");
    const [status, setStatus] = useState<MatchStatus | "">("");
    const [sort, setSort] = useState<MatchSortType>("LATEST");
    const [page, setPage] = useState(0);

    const [data, setData] = useState<PageResponse<MatchSummaryResponse>>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>();

    useEffect(() => {
        let active = true;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLoading(true);
        setError(undefined);

        getMatches({
            sportType: sportType || undefined,
            status: status || undefined,
            sort,
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
    }, [sportType, status, sort, page]);

    return (
        <main className="flex flex-1 flex-col items-center bg-zinc-50 px-4 py-12">
            <div className="w-full max-w-4xl">
                <h1 className="mb-6 text-2xl font-bold tracking-tight text-zinc-900">
                    매치 찾기
                </h1>

                <div className="mb-8 flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:flex-row">
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
                            value={status}
                            onChange={(e) => {
                                setStatus(e.target.value as MatchStatus | "");
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
                            정렬
                        </label>
                        <Select
                            value={sort}
                            onChange={(e) => {
                                setSort(e.target.value as MatchSortType);
                                setPage(0);
                            }}
                        >
                            {Object.entries(MATCH_SORT_LABEL).map(([value, label]) => (
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
                        모집 중인 매치가 없습니다.
                    </p>
                ) : (
                    <>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {data.content.map((match) => (
                                <MatchCard key={match.matchId} match={match} />
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

function MatchCard({ match }: { match: MatchSummaryResponse }) {
    const full = match.currentCount >= match.capacity;

    return (
        <Link
            href={`/matches/${match.matchId}`}
            className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:shadow-md"
        >
            <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold text-zinc-900">{match.title}</h2>
                <span
                    className={
                        match.status === "RECRUITING"
                            ? "shrink-0 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700"
                            : "shrink-0 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600"
                    }
                >
          {MATCH_STATUS_LABEL[match.status]}
        </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
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

            <div className="flex items-center justify-between text-sm">
        <span className={full ? "text-red-600" : "text-zinc-700"}>
          모집 {match.currentCount} / {match.capacity}명
        </span>
                <span className="font-semibold text-zinc-900">
          {match.feePerPerson.toLocaleString()}원
        </span>
            </div>

            <p className="text-xs text-zinc-400">
                모집 마감 {formatDeadline(match.recruitDeadline)}
            </p>
        </Link>
    );
}

function formatDeadline(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString("ko-KR", {
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
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