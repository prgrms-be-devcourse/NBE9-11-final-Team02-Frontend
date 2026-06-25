import { apiFetch } from "./http";
import type { FacilityCreateRequest, FacilityResponse, FacilitySlotResponse, FacilitySummaryResponse, SlotSetupRequest } from "./types";

export function getMyFacilities(managerId: string) {
    return apiFetch<FacilitySummaryResponse[]>("/api/v1/manager/facilities", {
        auth: true,
        headers: { "X-USER-ID": managerId },
    });
}

export function createFacility(managerId: string, request: FacilityCreateRequest) {
    return apiFetch<FacilityResponse>("/api/v1/manager/facilities", {
        method: "POST",
        auth: true,
        headers: { "X-USER-ID": managerId },
        body: request,
    });
}

export function setupFacilitySlots(managerId: string, facilityId: string, request: SlotSetupRequest) {
    return apiFetch<FacilitySlotResponse[]>(`/api/v1/manager/facilities/${facilityId}/slots`, {
        method: "POST",
        auth: true,
        headers: { "X-USER-ID": managerId },
        body: request,
    });
}
