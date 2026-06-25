import { API_BASE_URL, apiFetch } from "./http";
import { getAccessToken } from "./token";
import type { NotificationResponse } from "./types";

export function getNotifications() {
    return apiFetch<NotificationResponse[]>("/api/v1/notifications", { auth: true });
}

export function markNotificationRead(notificationId: string) {
    return apiFetch<NotificationResponse>(`/api/v1/notifications/${notificationId}/read`, {
        method: "PATCH",
        auth: true,
    });
}

export function subscribeNotifications(input: {
    onNotification: (notification: NotificationResponse) => void;
    onConnect?: () => void;
    onError?: (error: Error) => void;
}) {
    const controller = new AbortController();
    const token = getAccessToken();

    void (async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/notifications/subscribe`, {
                headers: {
                    Accept: "text/event-stream",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                credentials: "include",
                signal: controller.signal,
            });
            if (!response.ok || !response.body) {
                throw new Error(`알림 연결에 실패했습니다. (${response.status})`);
            }
            input.onConnect?.();
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";
            while (!controller.signal.aborted) {
                const { value, done } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const chunks = buffer.split("\n\n");
                buffer = chunks.pop() ?? "";
                for (const chunk of chunks) {
                    const event = parseSseChunk(chunk);
                    if (!event.data || event.event === "heartbeat" || event.data === "ping") continue;
                    if (event.event === "connect" || event.data === "connected") continue;
                    try {
                        input.onNotification(JSON.parse(event.data) as NotificationResponse);
                    } catch {
                        // 알 수 없는 SSE payload는 화면을 깨뜨리지 않도록 무시합니다.
                    }
                }
            }
        } catch (error) {
            if (!controller.signal.aborted) {
                input.onError?.(error instanceof Error ? error : new Error("알림 연결이 끊겼습니다."));
            }
        }
    })();

    return () => controller.abort();
}

function parseSseChunk(chunk: string) {
    let event = "message";
    const data: string[] = [];
    for (const line of chunk.split("\n")) {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        if (line.startsWith("data:")) data.push(line.slice(5).trim());
    }
    return { event, data: data.join("\n") };
}
