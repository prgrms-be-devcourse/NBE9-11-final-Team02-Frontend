"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getAdminFacilities } from "@/lib/admin";
import { ApiError } from "@/lib/http";
import { FACILITY_STATUS_LABEL, SPORT_TYPE_LABEL } from "@/lib/match-labels";
import type {
    AdminFacilityResponse,
    FacilityStatus,
    PageResponse,
} from "@/lib/types";

const STATUS_OPTIONS: FacilityStatus[] = ["ACTIVE", "CLOSED"];

const PAGE_SIZE = 15;

/** ISO 일시 → 'YYYY.MM.DD' */
function formatDate(value: string): string {
    return value.slice(0, 10).replace(/-/g, ".");
}

export default function AdminFacilitiesPage() {
    const [status, setStatus] = useState<FacilityStatus | "">("");
    const [page, setPage] = useState(0);

    const [data, setData] = useState<PageResponse<AdminFacilityResponse>>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>();

    useEffect(() => {
        let active = true;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLoading(true);
        setError(undefined);

        getAdminFacilities({
            status: status || undefined,
            page,
            size: PAGE_SIZE,
        })
            .then((res) => {
                if (active) setData(res);
            })
            .catch((e) => {
                if (!active) return;
                setError(
                    e instanceof ApiError
                        ? e.message
                        : "경기장 목록을 불러오지 못했습니다.",
                );
                setData(undefined);
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, [status, page]);

    return (
        <>
            <div className="admin-heading">
                <span>FACILITY MANAGEMENT</span>
                <h1>경기장 관리</h1>
                <p>플랫폼에 등록된 모든 경기장과 운영 상태를 확인하세요.</p>
            </div>

            <div className="admin-filter">
                <label>
                    운영 상태
                    <select
                        value={status}
                        onChange={(e) => {
                            setStatus(e.target.value as FacilityStatus | "");
                            setPage(0);
                        }}
                    >
                        <option value="">전체</option>
                        {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                                {FACILITY_STATUS_LABEL[s]}
                            </option>
                        ))}
                    </select>
                </label>
            </div>

            {error ? <p className="admin-error">{error}</p> : null}

            {loading ? (
                <div className="admin-empty">
                    <span className="auth-spinner" />
                </div>
            ) : !data || data.content.length === 0 ? (
                <div className="admin-empty">조건에 맞는 경기장이 없습니다.</div>
            ) : (
                <>
                    <p className="admin-meta">
                        <span>총 {data.totalElements.toLocaleString()}개</span>
                    </p>
                    <div className="admin-table">
                        {data.content.map((f) => (
                            <article
                                key={f.facilityId}
                                className="admin-row"
                                style={{
                                    gridTemplateColumns:
                                        "minmax(0,1.6fr) 1fr 110px auto",
                                }}
                            >
                                <div>
                                    <b>{f.name}</b>
                                    <span className="sub">⌖ {f.address}</span>
                                </div>
                                <div className="manager-sports">
                                    {f.sportTypes.map((s) => (
                                        <span key={s}>{SPORT_TYPE_LABEL[s]}</span>
                                    ))}
                                </div>
                                <div>
                                    <span
                                        className={`admin-badge ${
                                            f.status === "ACTIVE"
                                                ? "badge-on"
                                                : "badge-failed"
                                        }`}
                                    >
                                        {FACILITY_STATUS_LABEL[f.status]}
                                    </span>
                                    <span className="sub">
                                        {formatDate(f.createdAt)} 등록
                                    </span>
                                </div>
                                <div className="admin-row-actions">
                                    <Link href={`/facilities/${f.facilityId}`}>
                                        사용자 화면
                                    </Link>
                                </div>
                            </article>
                        ))}
                    </div>

                    <div className="pagination">
                        <button
                            type="button"
                            disabled={data.first}
                            onClick={() => setPage((p) => Math.max(0, p - 1))}
                        >
                            이전
                        </button>
                        <span>
                            {data.number + 1} / {Math.max(1, data.totalPages)}
                        </span>
                        <button
                            type="button"
                            disabled={data.last}
                            onClick={() => setPage((p) => p + 1)}
                        >
                            다음
                        </button>
                    </div>
                </>
            )}
        </>
    );
}