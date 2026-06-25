import { apiFetch } from "./http";
import type { MyRecordResponse, NotificationResponse, ReviewSubmitRequest } from "./types";

export function getMyRecords() {
    return apiFetch<MyRecordResponse>("/api/v1/users/me/records", { auth: true });
}

export function getNotifications() {
    return apiFetch<NotificationResponse[]>("/api/v1/notifications", { auth: true });
}

export function markNotificationRead(notificationId: string) {
    return apiFetch<NotificationResponse>(`/api/v1/notifications/${notificationId}/read`, {
        method: "PATCH",
        auth: true,
    });
}

export function submitReview(matchId: string, userId: string, request: ReviewSubmitRequest) {
    return apiFetch<void>(`/api/v1/matches/${matchId}/reviews`, {
        method: "POST",
        auth: true,
        headers: { "X-USER-ID": userId },
        body: request,
    });
}
