import { apiFetch } from "./http";
import type { FacilityCreateRequest, FacilityReservationOverviewResponse, FacilityResponse, FacilitySlotResponse, FacilitySummaryResponse, FacilityUpdateRequest, SlotSetupRequest, SlotUpdateRequest } from "./types";

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

export function getManagerFacility(managerId: string, facilityId: string) {
    return apiFetch<FacilityResponse>(`/api/v1/manager/facilities/${facilityId}`, {
        auth: true,
        headers: { "X-USER-ID": managerId },
    });
}

export function getManagerFacilitySlots(facilityId: string, date: string) {
    const query = new URLSearchParams({ date });
    return apiFetch<FacilitySlotResponse[]>(
        `/api/v1/manager/facilities/${facilityId}/slots?${query.toString()}`,
        { auth: true },
    );
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

export function updateFacility(managerId: string, facilityId: string, request: FacilityUpdateRequest) {
    return apiFetch<FacilityResponse>(`/api/v1/manager/facilities/${facilityId}`, {
        method: "PATCH",
        auth: true,
        headers: { "X-USER-ID": managerId },
        body: request,
    });
}

export function deleteFacility(managerId: string, facilityId: string) {
    return apiFetch<void>(`/api/v1/manager/facilities/${facilityId}`, {
        method: "DELETE",
        auth: true,
        headers: { "X-USER-ID": managerId },
    });
}

export function deleteFacilityImage(managerId: string, facilityId: string, imageUrl: string) {
    const query = new URLSearchParams({ imageUrl });
    return apiFetch<void>(`/api/v1/manager/facilities/${facilityId}/images?${query.toString()}`, {
        method: "DELETE",
        auth: true,
        headers: { "X-USER-ID": managerId },
    });
}
