import { apiFetch, buildQuery } from "./http";
import type {
    AdminFacilityResponse,
    AdminUserResponse,
    AdminUserRestrictionRequest,
    FacilityStatus,
    PageResponse,
    UserRole,
} from "./types";

interface PageQuery {
    page?: number;
    size?: number;
    sort?: string;
}

/** GET /api/v1/admin/facilities — 전체 경기장 목록(상태 필터·페이지네이션). ADMIN 전용 */
export function getAdminFacilities(
    params: { status?: FacilityStatus } & PageQuery = {},
) {
    return apiFetch<PageResponse<AdminFacilityResponse>>(
        `/api/v1/admin/facilities${buildQuery(params)}`,
        { auth: true },
    );
}

/** GET /api/v1/admin/users — 전체 회원 목록(역할 필터·페이지네이션). ADMIN 전용 */
export function getAdminUsers(params: { role?: UserRole } & PageQuery = {}) {
    return apiFetch<PageResponse<AdminUserResponse>>(
        `/api/v1/admin/users${buildQuery(params)}`,
        { auth: true },
    );
}

/** GET /api/v1/admin/users/blacklist — 이용 제한된 회원 목록. ADMIN 전용 */
export function getBlacklistedUsers(params: PageQuery = {}) {
    return apiFetch<PageResponse<AdminUserResponse>>(
        `/api/v1/admin/users/blacklist${buildQuery(params)}`,
        { auth: true },
    );
}

/** GET /api/v1/admin/users/blacklist/candidates — 매너점수 낮은 제한 후보. ADMIN 전용 */
export function getBlacklistCandidates(
    params: { maxMannerScore?: number; minReviewCount?: number } & PageQuery = {},
) {
    return apiFetch<PageResponse<AdminUserResponse>>(
        `/api/v1/admin/users/blacklist/candidates${buildQuery(params)}`,
        { auth: true },
    );
}

/** PATCH /api/v1/admin/users/{userId}/restriction — 회원 이용 제한 설정/해제. ADMIN 전용 */
export function updateUserRestriction(
    userId: string,
    request: AdminUserRestrictionRequest,
) {
    return apiFetch<AdminUserResponse>(
        `/api/v1/admin/users/${userId}/restriction`,
        {
            method: "PATCH",
            auth: true,
            body: request,
        },
    );
}