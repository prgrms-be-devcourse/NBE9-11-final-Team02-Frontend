import { apiFetch } from "./http";
import type { SelfReportedLevel, SportStatRegisterResponse, SportStatResponse, SportType } from "./types";

export function getSportStats() {
    return apiFetch<SportStatResponse[]>("/api/v1/users/me/sport-stats", { auth: true });
}

export function registerSportStats(stats: Array<{ sportType: SportType; selfReportedLevel: SelfReportedLevel }>) {
    return apiFetch<SportStatRegisterResponse>("/api/v1/users/me/sport-stats", {
        method: "POST",
        auth: true,
        body: { stats },
    });
}

export function updateSportStat(sportType: SportType, selfReportedLevel: SelfReportedLevel) {
    return apiFetch<void>(`/api/v1/users/me/sport-stats/${sportType}`, {
        method: "PATCH",
        auth: true,
        body: { selfReportedLevel },
    });
}
