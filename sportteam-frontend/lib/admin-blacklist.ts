import { apiFetch } from "./http";
import type { AdminUserResponse, PageResponse } from "./types";

function query(params: Record<string, string | number | undefined>) {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== "") search.set(key, String(value));
    });
    const qs = search.toString();
    return qs ? `?${qs}` : "";
}

export function getBlacklistCandidates(params: {
    maxMannerScore?: number;
    minReviewCount?: number;
    page?: number;
    size?: number;
} = {}) {
    return apiFetch<PageResponse<AdminUserResponse>>(
        `/api/v1/admin/users/blacklist/candidates${query(params)}`,
        { auth: true },
    );
}

export function getRestrictedUsers(params: { page?: number; size?: number } = {}) {
    return apiFetch<PageResponse<AdminUserResponse>>(
        `/api/v1/admin/users/blacklist${query(params)}`,
        { auth: true },
    );
}

export function updateUserRestriction(userId: string, request: {
    restricted: boolean;
    reason: string | null;
}) {
    return apiFetch<AdminUserResponse>(`/api/v1/admin/users/${userId}/restriction`, {
        method: "PATCH",
        auth: true,
        body: request,
    });
}
