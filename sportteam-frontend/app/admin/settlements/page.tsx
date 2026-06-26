"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/http";
import {
    SETTLEMENT_STATUS_LABEL,
    SPORT_TYPE_LABEL,
} from "@/lib/match-labels";
import { getSettlements, getSettlementSummary } from "@/lib/settlement";
import type {
    PageResponse,
    SettlementItemResponse,
    SettlementStatus,
    SettlementSummaryResponse,
    SportType,
} from "@/lib/types";

const SPORT_OPTIONS: SportType[] = [
    "FUTSAL",
    "SOCCER",
    "BASKETBALL",
    "TENNIS",
    "BADMINTON",
];

const PAGE_SIZE = 15;

/** Date → 'YYYY-MM-DD' */
function isoDate(d: Date): string {
    return d.toISOString().slice(0, 10);
}

function defaultRange(): { from: string; to: string } {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 29);
    return { from: isoDate(from), to: isoDate(to) };
}

function statusBadgeClass(status: SettlementStatus): string {
    const suffix =
        status === "SETTLED"
            ? "settled"
            : status === "HOLDING"
                ? "hold"
                : "failed";
    return `admin-badge badge-${suffix}`;
}

export default function AdminSettlementsPage() {
    const initial = defaultRange();
    // 입력 폼 값(적용 전)
    const [fromInput, setFromInput] = useState(initial.from);
    const [toInput, setToInput] = useState(initial.to);
    const [sportInput, setSportInput] = useState<SportType | "">("");

    // 실제 적용된 조회 조건
    const [query, setQuery] = useState({
        from: initial.from,
        to: initial.to,
        sportType: "" as SportType | "",
    });
    const [page, setPage] = useState(0);

    const [summary, setSummary] = useState<SettlementSummaryResponse>();
    const [items, setItems] = useState<PageResponse<SettlementItemResponse>>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>();

    const load = useCallback(async () => {
        setLoading(true);
        setError(undefined);
        try {
            const [summaryRes, itemsRes] = await Promise.all([
                getSettlementSummary(query.from, query.to),
                getSettlements({
                    from: query.from,
                    to: query.to,
                    sportType: query.sportType || undefined,
                    page,
                    size: PAGE_SIZE,
                }),
            ]);
            setSummary(summaryRes);
            setItems(itemsRes);
        } catch (e) {
            setError(
                e instanceof ApiError
                    ? e.message
                    : "정산 정보를 불러오지 못했습니다.",
            );
            setSummary(undefined);
            setItems(undefined);
        } finally {
            setLoading(false);
        }
    }, [query, page]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        load();
    }, [load]);

    function applyFilter(e: React.FormEvent) {
        e.preventDefault();
        setPage(0);
        setQuery({ from: fromInput, to: toInput, sportType: sportInput });
    }

    return (
        <>
            <div className="admin-heading">
                <span>SETTLEMENT</span>
                <h1>정산</h1>
                <p>기간별 참가비·플랫폼 수수료·호스트 정산액을 집계합니다.</p>
            </div>

            <form className="admin-filter" onSubmit={applyFilter}>
                <label>
                    시작일
                    <input type="date" value={fromInput} max={toInput}
                           onChange={(e) => setFromInput(e.target.value)} required />
                </label>
                <label>
                    종료일
                    <input type="date" value={toInput} min={fromInput}
                           onChange={(e) => setToInput(e.target.value)} required />
                </label>
                <label>
                    종목
                    <select value={sportInput}
                            onChange={(e) => setSportInput(e.target.value as SportType | "")}>
                        <option value="">전체</option>
                        {SPORT_OPTIONS.map((s) => (
                            <option key={s} value={s}>{SPORT_TYPE_LABEL[s]}</option>
                        ))}
                    </select>
                </label>
                <button type="submit">조회</button>
            </form>

            {error ? <p className="admin-error">{error}</p> : null}

            {loading ? (
                <div className="admin-empty">
                    <span className="auth-spinner" />
                </div>
            ) : (
                <>
                    {summary ? (
                        <>
                            <div className="admin-stat-grid">
                                <div className="admin-stat">
                                    <span>정산 건수</span>
                                    <strong>{summary.total.count.toLocaleString()}<small>건</small></strong>
                                </div>
                                <div className="admin-stat">
                                    <span>총 참가비</span>
                                    <strong>{summary.total.totalParticipantFee.toLocaleString()}<small>원</small></strong>
                                </div>
                                <div className="admin-stat">
                                    <span>플랫폼 수수료</span>
                                    <strong>{summary.total.totalPlatformFee.toLocaleString()}<small>원</small></strong>
                                </div>
                                <div className="admin-stat">
                                    <span>호스트 정산액</span>
                                    <strong>{summary.total.totalHostSettlementAmount.toLocaleString()}<small>원</small></strong>
                                </div>
                            </div>

                            {summary.breakdown.length > 0 ? (
                                <>
                                    <p className="admin-meta">
                                        <span>종목별 플랫폼 수수료</span>
                                    </p>
                                    <div className="admin-table">
                                        {summary.breakdown.map((b) => (
                                            <article key={b.sportType} className="admin-row"
                                                     style={{ gridTemplateColumns: "1fr 120px 1fr" }}>
                                                <b>{SPORT_TYPE_LABEL[b.sportType]}</b>
                                                <span className="cell muted">{b.count.toLocaleString()}건</span>
                                                <b>{b.totalPlatformFee.toLocaleString()}원</b>
                                            </article>
                                        ))}
                                    </div>
                                </>
                            ) : null}
                        </>
                    ) : null}

                    <div className="admin-meta">
                        <h2>정산 내역</h2>
                        {items ? (
                            <span>총 {items.totalElements.toLocaleString()}건</span>
                        ) : null}
                    </div>

                    {!items || items.content.length === 0 ? (
                        <div className="admin-empty">
                            해당 기간의 정산 내역이 없습니다.
                        </div>
                    ) : (
                        <>
                            <div className="admin-table">
                                {items.content.map((it) => (
                                    <article key={it.id} className="admin-row"
                                             style={{ gridTemplateColumns: "110px 1fr 1fr 1fr 110px" }}>
                                        <span className="cell">
                                            <span className="admin-badge badge-role-user">
                                                {SPORT_TYPE_LABEL[it.sportType]}
                                            </span>
                                        </span>
                                        <div>
                                            <b>참가비 {it.totalParticipantFee.toLocaleString()}원</b>
                                            <span className="sub">
                                                수수료율 {(it.appliedFeeRate * 100).toFixed(1)}%
                                            </span>
                                        </div>
                                        <span className="cell muted">
                                            수수료 {it.platformFee.toLocaleString()}원
                                        </span>
                                        <span className="cell">
                                            <b>정산 {it.hostSettlementAmount.toLocaleString()}원</b>
                                        </span>
                                        <span className="cell">
                                            <span className={statusBadgeClass(it.status)}>
                                                {SETTLEMENT_STATUS_LABEL[it.status]}
                                            </span>
                                        </span>
                                    </article>
                                ))}
                            </div>

                            <div className="pagination">
                                <button type="button" disabled={items.first}
                                        onClick={() => setPage((p) => Math.max(0, p - 1))}>이전</button>
                                <span>{items.number + 1} / {Math.max(1, items.totalPages)}</span>
                                <button type="button" disabled={items.last}
                                        onClick={() => setPage((p) => p + 1)}>다음</button>
                            </div>
                        </>
                    )}
                </>
            )}
        </>
    );
}