"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RequireAuth } from "@/components/require-auth";
import {
    getNotifications,
    markNotificationRead,
    subscribeNotifications,
} from "@/lib/notification";
import type { NotificationResponse } from "@/lib/types";

export default function NotificationsPage() {
    return (
        <RequireAuth>
            <NotificationList />
        </RequireAuth>
    );
}

function NotificationList() {
    const router = useRouter();
    const [items, setItems] = useState<NotificationResponse[]>();
    const [error, setError] = useState<string>();
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        let active = true;
        getNotifications()
            .then((value) => {
                if (active) setItems(value);
            })
            .catch((err) => {
                if (active) setError(err instanceof Error ? err.message : "알림을 불러오지 못했습니다.");
            });
        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        const unsubscribe = subscribeNotifications({
            onConnect: () => setConnected(true),
            onError: (err) => {
                setConnected(false);
                setError(err.message);
            },
            onNotification: (notification) => {
                setItems((current) => {
                    const list = current ?? [];
                    if (list.some((item) => item.notificationId === notification.notificationId)) return list;
                    return [notification, ...list];
                });
            },
        });
        return unsubscribe;
    }, []);

    const unreadCount = useMemo(() => items?.filter((item) => !item.read).length ?? 0, [items]);

    async function openNotification(item: NotificationResponse) {
        try {
            if (!item.read) {
                const updated = await markNotificationRead(item.notificationId);
                setItems((current) => current?.map((value) =>
                    value.notificationId === updated.notificationId ? updated : value,
                ));
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "알림을 읽음 처리하지 못했습니다.");
        }

        if (item.referenceId) {
            router.push(`/matches/${item.referenceId}`);
        }
    }

    return (
        <main className="flow-page">
            <div className="flow-shell">
                <div className="flow-heading">
                    <span>NOTIFICATIONS</span>
                    <h1>알림</h1>
                    <p>매치 확정, 취소, 리마인드 알림을 실시간으로 확인하세요.</p>
                </div>

                <div className="record-panel">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h2>읽지 않은 알림 {unreadCount}개</h2>
                            <p className="text-xs text-zinc-500">
                                SSE 상태: {connected ? "연결됨" : "연결 대기"}
                            </p>
                        </div>
                        <span className={connected ? "pill green" : "pill red"}>
                            {connected ? "LIVE" : "OFFLINE"}
                        </span>
                    </div>
                </div>

                {error ? <p className="notification-error">{error}</p> : null}

                <div className="notification-list">
                    {!items ? (
                        <div className="auth-loading"><span className="auth-spinner" /></div>
                    ) : items.length === 0 ? (
                        <p className="record-empty">새로운 알림이 없습니다.</p>
                    ) : (
                        items.map((item) => (
                            <button
                                type="button"
                                key={item.notificationId}
                                className={item.read ? "read" : ""}
                                onClick={() => void openNotification(item)}
                            >
                                <i />
                                <div>
                                    <b>{item.title}</b>
                                    <p>{item.content}</p>
                                    <small>
                                        {notificationTypeLabel(item.type)} · {formatDate(item.createdAt)}
                                    </small>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>
        </main>
    );
}

function notificationTypeLabel(type: string) {
    if (type === "MATCH_CONFIRMED") return "예약 확정";
    if (type === "MATCH_CANCELLED") return "경기 취소";
    if (type === "MATCH_REMINDER") return "경기 리마인드";
    return type;
}

function formatDate(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("ko-KR", {
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
}
