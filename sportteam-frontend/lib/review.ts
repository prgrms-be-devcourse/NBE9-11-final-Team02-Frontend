import { apiFetch, buildQuery } from "./http";
import type { FacilityReviewResponse, PageResponse } from "./types";

/** GET /api/v1/facilities/{facilityId}/reviews — 시설 이용 후기 목록(페이지네이션). 공개 */
export function getFacilityReviews(
    facilityId: string,
    params: { page?: number; size?: number; sort?: string } = {},
) {
    return apiFetch<PageResponse<FacilityReviewResponse>>(
        `/api/v1/facilities/${facilityId}/reviews${buildQuery(params)}`,
    );
}