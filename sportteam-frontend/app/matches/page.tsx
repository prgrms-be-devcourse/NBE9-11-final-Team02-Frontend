"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MatchCard } from "@/components/match-card";
import { Select } from "@/components/ui";
import { ApiError } from "@/lib/http";
import { getMatches } from "@/lib/match";
import {
    MATCH_SORT_LABEL,
    MATCH_STATUS_LABEL,
    SPORT_TYPE_LABEL,
} from "@/lib/match-labels";
import type {
    MatchSortType,
    MatchStatus,
    MatchSummaryResponse,
    PageResponse,
    SportType,
} from "@/lib/types";

const PAGE_SIZE = 12;
const MATCH_VISIBILITY_ORDER: Record<MatchStatus, number> = {
    RECRUITING: 0,
    CONFIRMED: 1,
    COMPLETED: 2,
    CANCELLED: 3,
};

export default function MatchesPage() {
    const [sportType, setSportType] = useState<SportType | "">("");
    const [status, setStatus] = useState<MatchStatus | "">("");
    const [sort, setSort] = useState<MatchSortType>("LATEST");
    const [page, setPage] = useState(0);
    const [reloadKey, setReloadKey] = useState(0);

    const [data, setData] = useState<PageResponse<MatchSummaryResponse>>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>();
    const visibleMatches = data?.content
        ? [...data.content].sort((a, b) => {
            const statusOrder = MATCH_VISIBILITY_ORDER[a.status] - MATCH_VISIBILITY_ORDER[b.status];
            if (statusOrder !== 0) return statusOrder;
            return new Date(a.recruitDeadline).getTime() - new Date(b.recruitDeadline).getTime();
        })
        : [];

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
    }, [sportType, status, sort, page, reloadKey]);

    return (
        <main className="listing-page">
            <section className="listing-hero">
                <div className="container">
                    <Link href="/" className="listing-back-home">← 메인으로</Link>
                    <span className="eyebrow"><i /> MATCH</span>
                    <h1>
                        함께 뛸 팀을<br />
                        <strong>매치 찾기</strong>
                    </h1>
                    <p>종목과 모집 상태로 지금 참여할 수 있는 매치를 찾아보세요.</p>
                </div>
            </section>

            <section className="listing-content">
                <div className="container">
                    <div className="filter-bar">
                        <label>
                            <span>종목</span>
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
                        </label>
                        <label>
                            <span>모집 상태</span>
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
                        </label>
                        <label>
                            <span>정렬</span>
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
                        </label>
                    </div>

                    {loading ? (
                        <div className="auth-loading">
                            <span className="auth-spinner" />
                        </div>
                    ) : error ? (
                        <div className="manager-empty">
                            <span>!</span>
                            <h2>매치 목록을 불러오지 못했습니다.</h2>
                            <p>{error}</p>
                            <button
                                type="button"
                                onClick={() => setReloadKey((value) => value + 1)}
                            >
                                다시 시도
                            </button>
                        </div>
                    ) : !data || data.content.length === 0 ? (
                        <div className="manager-empty">
                            <span>⌕</span>
                            <h2>조건에 맞는 매치가 없습니다.</h2>
                            <p>필터를 바꾸거나 다른 종목으로 다시 조회해보세요.</p>
                        </div>
                    ) : (
                        <>
                            <div className="list-meta">
                                <h2>매치 전체보기</h2>
                                <span>{data.totalElements ?? data.content.length}개의 매치</span>
                                <Link
                                    href="/matches/recommendations"
                                    className="text-link"
                                    style={{ marginLeft: "auto" }}
                                >
                                    맞춤 추천 →
                                </Link>
                            </div>
                            <div className="match-grid">
                                {visibleMatches.map((match) => (
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
            </section>
        </main>
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
        <div className="pagination">
            <button type="button" disabled={page === 0} onClick={() => onChange(page - 1)}>
                이전
            </button>
            <span>
                {page + 1} / {totalPages}
            </span>
            <button
                type="button"
                disabled={page >= totalPages - 1}
                onClick={() => onChange(page + 1)}
            >
                다음
            </button>
        </div>
    );
}
