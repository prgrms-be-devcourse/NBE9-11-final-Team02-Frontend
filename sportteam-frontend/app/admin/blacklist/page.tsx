"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, FormError } from "@/components/ui";
import { RequireAuth } from "@/components/require-auth";
import { useAuth } from "@/lib/auth-context";
import {
    getBlacklistCandidates,
    getRestrictedUsers,
    updateUserRestriction,
} from "@/lib/admin-blacklist";
import type { AdminUserResponse } from "@/lib/types";

export default function AdminBlacklistPage() {
    return (
        <RequireAuth>
            <BlacklistDashboard />
        </RequireAuth>
    );
}

function BlacklistDashboard() {
    const { user } = useAuth();
    const [candidates, setCandidates] = useState<AdminUserResponse[]>([]);
    const [restrictedUsers, setRestrictedUsers] = useState<AdminUserResponse[]>([]);
    const [selected, setSelected] = useState<AdminUserResponse>();
    const [reason, setReason] = useState("비매너 신고 누적");
    const [error, setError] = useState<string>();
    const [message, setMessage] = useState<string>();
    const [loading, setLoading] = useState(false);

    const load = useCallback(async () => {
        setError(undefined);
        const [candidatePage, restrictedPage] = await Promise.all([
            getBlacklistCandidates({ maxMannerScore: 2.5, minReviewCount: 3, size: 20 }),
            getRestrictedUsers({ size: 20 }),
        ]);
        setCandidates(candidatePage.content);
        setRestrictedUsers(restrictedPage.content);
        setSelected((current) => current ?? candidatePage.content[0] ?? restrictedPage.content[0]);
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        load().catch((err) => setError(err instanceof Error ? err.message : "블랙리스트 데이터를 불러오지 못했습니다."));
    }, [load]);

    const stats = useMemo(() => ({
        candidates: candidates.length,
        restricted: restrictedUsers.length,
        lowManner: candidates.filter((item) => Number(item.mannerScore ?? 0) <= 2.5).length,
    }), [candidates, restrictedUsers]);

    async function restrict(target: AdminUserResponse, restricted: boolean) {
        setLoading(true);
        setError(undefined);
        setMessage(undefined);
        try {
            const updated = await updateUserRestriction(target.userId, {
                restricted,
                reason: restricted ? reason : null,
            });
            setSelected(updated);
            setMessage(restricted ? "사용자를 이용 제한 처리했습니다." : "이용 제한을 해제했습니다.");
            await load();
        } catch (err) {
            setError(err instanceof Error ? err.message : "이용 제한 상태를 변경하지 못했습니다.");
        } finally {
            setLoading(false);
        }
    }

    if (user?.role !== "ADMIN") {
        return (
            <main className="manager-page">
                <div className="manager-shell manager-empty">
                    <h1>관리자 권한이 필요합니다.</h1>
                    <p>블랙리스트 관리는 플랫폼 관리자만 접근할 수 있습니다.</p>
                </div>
            </main>
        );
    }

    return (
        <main className="manager-page">
            <div className="manager-shell">
                <div className="manager-heading">
                    <div>
                        <span>ADMIN</span>
                        <h1>비매너 신고 및 이용 제한</h1>
                        <p>매너 점수와 리뷰 수를 기준으로 제한 후보를 확인하고 제한 상태를 관리합니다.</p>
                    </div>
                </div>

                <div className="reservation-summary">
                    <div><span>제한 후보</span><strong>{stats.candidates}</strong><small>명</small></div>
                    <div><span>현재 제한</span><strong>{stats.restricted}</strong><small>명</small></div>
                    <div><span>매너 2.5 이하</span><strong>{stats.lowManner}</strong><small>명</small></div>
                    <div><span>기준</span><strong>3</strong><small>리뷰 이상</small></div>
                </div>

                {error ? <FormError message={error} /> : null}
                {message ? <p className="manager-success">{message}</p> : null}

                <div className="detail-layout">
                    <section className="record-panel">
                        <h2>블랙리스트 후보</h2>
                        <UserTable items={candidates} selected={selected} onSelect={setSelected} />

                        <h2 className="mt-8">현재 제한 사용자</h2>
                        <UserTable items={restrictedUsers} selected={selected} onSelect={setSelected} />
                    </section>

                    <aside className="join-card">
                        {selected ? (
                            <>
                                <span>{selected.restricted ? "제한 중" : "제한 후보"}</span>
                                <strong>{selected.nickname}</strong>
                                <div className="join-summary">
                                    <p><span>이메일</span><b>{selected.email}</b></p>
                                    <p><span>역할</span><b>{selected.role}</b></p>
                                    <p><span>매너 점수</span><b>{selected.mannerScore ?? "-"}</b></p>
                                    <p><span>평가 수</span><b>{selected.mannerReviewCount}건</b></p>
                                    <p><span>상태</span><b>{selected.restricted ? "이용 제한" : "정상"}</b></p>
                                </div>
                                <label className="manager-field">
                                    제한 사유
                                    <textarea value={reason} onChange={(event) => setReason(event.target.value)} />
                                </label>
                                <div className="match-actions mt-4">
                                    <Button
                                        type="button"
                                        loading={loading}
                                        disabled={selected.restricted || !reason.trim()}
                                        onClick={() => void restrict(selected, true)}
                                        className="bg-red-600 hover:bg-red-700"
                                    >
                                        블랙리스트 등록
                                    </Button>
                                    <Button
                                        type="button"
                                        loading={loading}
                                        disabled={!selected.restricted}
                                        onClick={() => void restrict(selected, false)}
                                        className="mt-2 bg-zinc-700 hover:bg-zinc-800"
                                    >
                                        이용 제한 해제
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <p className="record-empty">선택된 사용자가 없습니다.</p>
                        )}
                    </aside>
                </div>
            </div>
        </main>
    );
}

function UserTable({
    items,
    selected,
    onSelect,
}: {
    items: AdminUserResponse[];
    selected?: AdminUserResponse;
    onSelect: (item: AdminUserResponse) => void;
}) {
    if (items.length === 0) {
        return <p className="record-empty">조회된 사용자가 없습니다.</p>;
    }
    return (
        <div className="reservation-table">
            {items.map((item) => (
                <article
                    key={item.userId}
                    className={selected?.userId === item.userId ? "editing" : ""}
                    onClick={() => onSelect(item)}
                >
                    <div>
                        <b>{item.nickname}</b>
                        <span>{item.email}</span>
                    </div>
                    <div>
                        <em className={item.restricted ? "slot-blocked" : "slot-available"}>
                            {item.restricted ? "이용 제한" : "후보"}
                        </em>
                        <small>매너 {item.mannerScore ?? "-"} · 리뷰 {item.mannerReviewCount}건</small>
                    </div>
                    <strong>{item.role}</strong>
                </article>
            ))}
        </div>
    );
}



