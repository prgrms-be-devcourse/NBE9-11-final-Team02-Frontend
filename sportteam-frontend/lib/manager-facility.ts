import { apiFetch } from "./http";
import type { FacilityCreateRequest, FacilityReservationOverviewResponse, FacilityResponse, FacilitySlotResponse, FacilitySummaryResponse, SlotSetupRequest, SlotUpdateRequest } from "./types";

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

export function getFacilityReservations(managerId: string, facilityId: string, fromDate: string, toDate: string) {
    const query = new URLSearchParams({ fromDate, toDate });
    return apiFetch<FacilityReservationOverviewResponse>(
        `/api/v1/manager/facilities/${facilityId}/reservations?${query.toString()}`,
        {
            auth: true,
            headers: { "X-USER-ID": managerId },
        },
    );
}

export function updateFacilitySlot(
    managerId: string,
    facilityId: string,
    slotId: string,
    request: SlotUpdateRequest,
) {
    return apiFetch<FacilitySlotResponse>(`/api/v1/manager/facilities/${facilityId}/slots/${slotId}`, {
        method: "PATCH",
        auth: true,
        headers: { "X-USER-ID": managerId },
        body: request,
    });
}
