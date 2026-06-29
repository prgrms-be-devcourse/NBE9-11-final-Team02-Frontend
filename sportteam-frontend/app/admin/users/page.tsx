"use client";

import { useCallback, useEffect, useState } from "react";
import {
    getAdminUsers,
    getBlacklistCandidates,
    getBlacklistedUsers,
    updateUserRestriction,
} from "@/lib/admin";
import { ApiError } from "@/lib/http";
import { USER_ROLE_LABEL } from "@/lib/match-labels";
import type { AdminUserResponse, PageResponse, UserRole } from "@/lib/types";

type View = "ALL" | "BLACKLIST" | "CANDIDATES";

const VIEW_TABS: Array<{ key: View; label: string }> = [
    { key: "ALL", label: "전체 회원" },
    { key: "BLACKLIST", label: "이용 제한" },
    { key: "CANDIDATES", label: "제한 후보" },
];

const ROLE_OPTIONS: UserRole[] = ["USER", "MANAGER", "ADMIN"];

const PAGE_SIZE = 15;

/** ISO 일시 → 'YYYY.MM.DD' */
function formatDate(value: string | null): string {
    if (!value) return "-";
    return value.slice(0, 10).replace(/-/g, ".");
}

function roleBadgeClass(role: UserRole): string {
    return `admin-badge badge-role-${role.toLowerCase()}`;
}

export default function AdminUsersPage() {
    const [view, setView] = useState<View>("ALL");
    const [role, setRole] = useState<UserRole | "">("");
    const [page, setPage] = useState(0);

    const [data, setData] = useState<PageResponse<AdminUserResponse>>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>();
    const [pendingId, setPendingId] = useState<string>();

    const load = useCallback(async () => {
        setLoading(true);
        setError(undefined);
        try {
            const common = { page, size: PAGE_SIZE };
            const result =
                view === "BLACKLIST"
                    ? await getBlacklistedUsers(common)
                    : view === "CANDIDATES"
                        ? await getBlacklistCandidates(common)
                        : await getAdminUsers({
                            ...common,
                            role: role || undefined,
                        });
            setData(result);
        } catch (e) {
            setError(
                e instanceof ApiError
                    ? e.message
                    : "회원 목록을 불러오지 못했습니다.",
            );
            setData(undefined);
        } finally {
            setLoading(false);
        }
    }, [view, role, page]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        load();
    }, [load]);

    function changeView(next: View) {
        setView(next);
        setRole("");
        setPage(0);
    }

    async function toggleRestriction(target: AdminUserResponse) {
        const nextRestricted = !target.restricted;
        let reason = "";
        if (nextRestricted) {
            const input = window.prompt(
                `'${target.nickname}' 회원을 이용 제한합니다.\n제한 사유를 입력하세요.`,
                "",
            );
            if (input === null) return; // 취소
            reason = input.trim();
        } else if (
            !window.confirm(`'${target.nickname}' 회원의 이용 제한을 해제할까요?`)
        ) {
            return;
        }

        setPendingId(target.userId);
        setError(undefined);
        try {
            await updateUserRestriction(target.userId, {
                restricted: nextRestricted,
                reason: reason || undefined,
            });
            await load();
        } catch (e) {
            setError(
                e instanceof ApiError
                    ? e.message
                    : "이용 제한 상태를 변경하지 못했습니다.",
            );
        } finally {
            setPendingId(undefined);
        }
    }

    return (
        <>
            <div className="admin-heading">
                <span>USER MANAGEMENT</span>
                <h1>회원 관리</h1>
                <p>회원 권한과 매너점수를 확인하고 이용 제한을 관리하세요.</p>
            </div>

            <div className="admin-nav">
                {VIEW_TABS.map((tab) => (
                    <button
                        key={tab.key}
                        type="button"
                        className={view === tab.key ? "active" : undefined}
                        onClick={() => changeView(tab.key)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {view === "ALL" ? (
                <div className="admin-filter">
                    <label>
                        역할
                        <select
                            value={role}
                            onChange={(e) => {
                                setRole(e.target.value as UserRole | "");
                                setPage(0);
                            }}
                        >
                            <option value="">전체</option>
                            {ROLE_OPTIONS.map((r) => (
                                <option key={r} value={r}>
                                    {USER_ROLE_LABEL[r]}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>
            ) : null}

            {view === "CANDIDATES" ? (
                <p className="admin-meta">
                    <span>매너점수가 낮은 순으로 정렬된 이용 제한 후보입니다.</span>
                </p>
            ) : null}

            {error ? <p className="admin-error">{error}</p> : null}

            {loading ? (
                <div className="admin-empty">
                    <span className="auth-spinner" />
                </div>
            ) : !data || data.content.length === 0 ? (
                <div className="admin-empty">조건에 맞는 회원이 없습니다.</div>
            ) : (
                <>
                    <div className="admin-table">
                        {data.content.map((u) => (
                            <article
                                key={u.userId}
                                className="admin-row"
                                style={{
                                    gridTemplateColumns:
                                        "minmax(0,1.6fr) 110px 120px 1fr auto",
                                }}
                            >
                                <div>
                                    <b>{u.nickname}</b>
                                    <span className="sub">{u.email}</span>
                                </div>
                                <span className="cell">
                                    <span className={roleBadgeClass(u.role)}>
                                        {USER_ROLE_LABEL[u.role]}
                                    </span>
                                </span>
                                <span className="cell">
                                    {u.role !== "ADMIN" ? (
                                        <>
                                            <b>매너 {u.mannerScore ?? "-"}</b>
                                            <span className="sub">
                                                리뷰 {u.mannerReviewCount}건
                                            </span>
                                        </>
                                    ) : null}
                                </span>
                                <div>
                                    {u.role !== "ADMIN" ? (
                                        u.restricted ? (
                                            <>
                                                <span className="admin-badge badge-off">
                                                    이용 제한
                                                </span>
                                                <span className="sub">
                                                    {u.restrictionReason || "사유 미입력"}{" "}
                                                    ({formatDate(u.restrictedAt)})
                                                </span>
                                            </>
                                        ) : (
                                            <span className="admin-badge badge-on">
                                                정상
                                            </span>
                                        )
                                    ) : null}
                                </div>
                                <div className="admin-row-actions">
                                    {u.role !== "ADMIN" ? (
                                        <button
                                            type="button"
                                            className={u.restricted ? undefined : "danger"}
                                            disabled={pendingId === u.userId}
                                            onClick={() => toggleRestriction(u)}
                                        >
                                            {pendingId === u.userId
                                                ? "처리 중…"
                                                : u.restricted
                                                    ? "제한 해제"
                                                    : "이용 제한"}
                                        </button>
                                    ) : null}
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