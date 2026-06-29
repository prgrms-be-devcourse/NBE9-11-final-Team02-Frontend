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

/** 종목별 도넛/범례 색상 (SPORT_OPTIONS 순서와 무관하게 종목 고정) */
const SPORT_COLOR: Record<SportType, string> = {
    FUTSAL: "#0d7a54",
    SOCCER: "#3fa97e",
    BASKETBALL: "#e08a3c",
    TENNIS: "#5b8def",
    BADMINTON: "#c0567b",
};

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
                            <p className="admin-meta">
                                <span>정산 집계</span>
                                <span>정산 {summary.total.count.toLocaleString()}건</span>
                            </p>
                            <div className="admin-equation">
                                <div className="eq-item">
                                    <span>총 참가비</span>
                                    <strong>{summary.total.totalParticipantFee.toLocaleString()}원</strong>
                                </div>
                                <i className="eq-op">−</i>
                                <div className="eq-item">
                                    <span>
                                        플랫폼 수수료
                                        <em>
                                            {summary.total.totalParticipantFee > 0
                                                ? `${(
                                                    (summary.total.totalPlatformFee /
                                                        summary.total.totalParticipantFee) *
                                                    100
                                                ).toFixed(1)}%`
                                                : "0%"}
                                        </em>
                                    </span>
                                    <strong>{summary.total.totalPlatformFee.toLocaleString()}원</strong>
                                </div>
                                <i className="eq-op">=</i>
                                <div className="eq-item highlight">
                                    <span>호스트 정산액</span>
                                    <strong>{summary.total.totalHostSettlementAmount.toLocaleString()}원</strong>
                                </div>
                            </div>

                            {summary.breakdown.length > 0 ? (
                                <>
                                    <p className="admin-meta">
                                        <span>종목별 플랫폼 수수료 비중</span>
                                    </p>
                                    {(() => {
                                        const ranked = [...summary.breakdown].sort(
                                            (a, b) => b.totalPlatformFee - a.totalPlatformFee,
                                        );
                                        const totalFee = ranked.reduce(
                                            (sum, b) => sum + b.totalPlatformFee,
                                            0,
                                        );
                                        const R = 60;
                                        const C = 2 * Math.PI * R;
                                        let offset = 0;
                                        return (
                                            <div className="admin-donut">
                                                <svg viewBox="0 0 160 160" className="donut-svg">
                                                    {totalFee > 0 ? (
                                                        ranked.map((b) => {
                                                            const frac = b.totalPlatformFee / totalFee;
                                                            const dash = frac * C;
                                                            const seg = (
                                                                <circle
                                                                    key={b.sportType}
                                                                    cx="80"
                                                                    cy="80"
                                                                    r={R}
                                                                    fill="none"
                                                                    stroke={SPORT_COLOR[b.sportType]}
                                                                    strokeWidth="20"
                                                                    strokeDasharray={`${dash} ${C - dash}`}
                                                                    strokeDashoffset={-offset}
                                                                />
                                                            );
                                                            offset += dash;
                                                            return seg;
                                                        })
                                                    ) : (
                                                        <circle cx="80" cy="80" r={R} fill="none"
                                                                stroke="#edf1ee" strokeWidth="20" />
                                                    )}
                                                    <text x="80" y="74" className="donut-label">총 수수료</text>
                                                    <text x="80" y="94" className="donut-value">
                                                        {totalFee.toLocaleString()}원
                                                    </text>
                                                </svg>
                                                <ul className="donut-legend">
                                                    {ranked.map((b, i) => (
                                                        <li key={b.sportType}>
                                                            <i style={{ background: SPORT_COLOR[b.sportType] }} />
                                                            <span className="rank">{i + 1}</span>
                                                            <span className="name">{SPORT_TYPE_LABEL[b.sportType]}</span>
                                                            <b>{b.totalPlatformFee.toLocaleString()}원</b>
                                                            <span className="pct">
                                                                {totalFee > 0
                                                                    ? `${((b.totalPlatformFee / totalFee) * 100).toFixed(1)}%`
                                                                    : "0%"}
                                                            </span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        );
                                    })()}
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