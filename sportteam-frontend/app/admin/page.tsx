"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
    getAdminFacilities,
    getAdminUsers,
    getBlacklistedUsers,
} from "@/lib/admin";
import { ApiError } from "@/lib/http";
import { getSettlementSummary } from "@/lib/settlement";
import type { SettlementSummaryResponse } from "@/lib/types";

/** Date → 'YYYY-MM-DD' (백엔드 LocalDate 형식) */
function isoDate(d: Date): string {
    return d.toISOString().slice(0, 10);
}

interface Overview {
    userCount: number;
    facilityCount: number;
    blacklistCount: number;
    summary: SettlementSummaryResponse;
}

export default function AdminDashboardPage() {
    const [data, setData] = useState<Overview>();
    const [error, setError] = useState<string>();

    useEffect(() => {
        let active = true;
        const to = new Date();
        const from = new Date();
        from.setDate(from.getDate() - 29);

        Promise.all([
            getAdminUsers({ size: 1 }),
            getAdminFacilities({ size: 1 }),
            getBlacklistedUsers({ size: 1 }),
            getSettlementSummary(isoDate(from), isoDate(to)),
        ])
            .then(([users, facilities, blacklist, summary]) => {
                if (!active) return;
                setData({
                    userCount: users.totalElements,
                    facilityCount: facilities.totalElements,
                    blacklistCount: blacklist.totalElements,
                    summary,
                });
            })
            .catch((e) => {
                if (active) {
                    setError(
                        e instanceof ApiError
                            ? e.message
                            : "대시보드를 불러오지 못했습니다.",
                    );
                }
            });

        return () => {
            active = false;
        };
    }, []);

    return (
        <>
            <div className="admin-heading">
                <span>ADMIN CONSOLE</span>
                <h1>운영 대시보드</h1>
                <p>플랫폼 회원·경기장·정산 현황을 한눈에 확인하세요.</p>
            </div>

            {error ? (
                <p className="admin-error">{error}</p>
            ) : !data ? (
                <div className="admin-empty">
                    <span className="auth-spinner" />
                </div>
            ) : (
                <>
                    <div className="admin-stat-grid">
                        <div className="admin-stat">
                            <span>전체 회원</span>
                            <strong>{data.userCount.toLocaleString()}<small>명</small></strong>
                        </div>
                        <div className="admin-stat">
                            <span>등록 경기장</span>
                            <strong>{data.facilityCount.toLocaleString()}<small>곳</small></strong>
                        </div>
                        <div className="admin-stat">
                            <span>이용 제한 회원</span>
                            <strong>{data.blacklistCount.toLocaleString()}<small>명</small></strong>
                        </div>
                        <div className="admin-stat">
                            <span>최근 30일 플랫폼 수수료</span>
                            <strong>{data.summary.total.totalPlatformFee.toLocaleString()}<small>원</small></strong>
                        </div>
                    </div>

                    <div className="admin-card-grid">
                        <Link className="admin-card" href="/admin/users">
                            <b>회원 관리</b>
                            <p>회원 검색·권한 확인, 매너점수 기반 이용 제한 및 블랙리스트를 관리합니다.</p>
                        </Link>
                        <Link className="admin-card" href="/admin/facilities">
                            <b>경기장 관리</b>
                            <p>전체 등록 경기장 목록과 운영 상태를 상태별로 조회합니다.</p>
                        </Link>
                        <Link className="admin-card" href="/admin/settlements">
                            <b>정산</b>
                            <p>기간별 참가비·플랫폼 수수료·호스트 정산액을 집계하고 내역을 조회합니다.</p>
                        </Link>
                    </div>
                </>
            )}
        </>
    );
}