import { apiFetch } from "./http";
import type {
    MatchDetailResponse,
    MatchParticipantResponse,
    MatchSortType,
    MatchStatus,
    MatchSummaryResponse,
    PageResponse,
    RequiredGender,
    SkillLevel,
    SportType,
} from "./types";

export interface GetMatchesParams {
    sportType?: SportType;
    status?: MatchStatus;
    minSkillLevel?: SkillLevel;
    maxSkillLevel?: SkillLevel;
    requiredGender?: RequiredGender;
    sort?: MatchSortType;
    page?: number;
    size?: number;
}

/** 매치 목록 조회 (필터/정렬/페이지네이션) */
export function getMatches(
    params: GetMatchesParams = {},
): Promise<PageResponse<MatchSummaryResponse>> {
    const query = new URLSearchParams();
    if (params.sportType) query.set("sportType", params.sportType);
    if (params.status) query.set("status", params.status);
    if (params.minSkillLevel) query.set("minSkillLevel", params.minSkillLevel);
    if (params.maxSkillLevel) query.set("maxSkillLevel", params.maxSkillLevel);
    if (params.requiredGender) query.set("requiredGender", params.requiredGender);
    query.set("sort", params.sort ?? "LATEST");
    query.set("page", String(params.page ?? 0));
    query.set("size", String(params.size ?? 20));

    return apiFetch<PageResponse<MatchSummaryResponse>>(
        `/api/v1/matches?${query.toString()}`,
    );
}

/** 매치 상세 조회 */
export function getMatch(matchId: string): Promise<MatchDetailResponse> {
    return apiFetch<MatchDetailResponse>(`/api/v1/matches/${matchId}`);
}

/** 매치 참가자 목록 조회 */
export function getMatchParticipants(
    matchId: string,
): Promise<MatchParticipantResponse[]> {
    return apiFetch<MatchParticipantResponse[]>(
        `/api/v1/matches/${matchId}/participants`,
    );
}

/** 매치 참여 */
export function joinMatch(
    matchId: string,
): Promise<MatchParticipantResponse> {
    return apiFetch<MatchParticipantResponse>(
        `/api/v1/matches/${matchId}/participants`,
        { method: "POST", auth: true },
    );
}

/** 매치 참여 취소 (나가기) */
export function leaveMatch(matchId: string): Promise<void> {
    return apiFetch<void>(`/api/v1/matches/${matchId}/participants/me`, {
        method: "DELETE",
        auth: true,
    });
}