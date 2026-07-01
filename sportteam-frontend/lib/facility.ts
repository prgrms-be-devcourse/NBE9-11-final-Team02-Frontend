import { apiFetch } from "./http";
import type {
    FacilityAvailableResponse,
    FacilityResponse,
    FacilitySlotResponse,
    PageResponse,
    SportType,
} from "./types";

export interface GetAvailableFacilitiesParams {
    sportType?: SportType;
    region?: string;
    date?: string; // YYYY-MM-DD
    page?: number;
    size?: number;
}

/** 예약 가능한 시설 목록 조회 (검색/필터/페이지네이션) */
export function getAvailableFacilities(
    params: GetAvailableFacilitiesParams = {},
): Promise<PageResponse<FacilityAvailableResponse>> {
    const query = new URLSearchParams();
    if (params.sportType) query.set("sportType", params.sportType);
    if (params.region) query.set("region", params.region);
    if (params.date) query.set("date", params.date);
    query.set("page", String(params.page ?? 0));
    query.set("size", String(params.size ?? 20));

    return apiFetch<PageResponse<FacilityAvailableResponse>>(
        `/api/v1/facilities/available?${query.toString()}`,
    );
}

/** 시설 상세 조회 */
export function getFacility(facilityId: string): Promise<FacilityResponse> {
    return apiFetch<FacilityResponse>(`/api/v1/facilities/${facilityId}`);
}

/** 날짜별 예약 가능 슬롯 조회 */
export function getFacilitySlots(
    facilityId: string,
    date: string,
): Promise<FacilitySlotResponse[]> {
    const query = new URLSearchParams({ date });
    return apiFetch<FacilitySlotResponse[]>(
        `/api/v1/facilities/${facilityId}/slots?${query.toString()}`,
    );
}
