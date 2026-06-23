import { apiFetch } from "./http";
import type {
    MatchParticipantRole,
    MatchPaymentResponse,
    MyMatchResponse,
    MyMatchStatus,
    PageResponse,
    SportType,
} from "./types";

export interface GetMyMatchesParams {
    sportType?: SportType;
    myMatchStatus?: MyMatchStatus;
    role?: MatchParticipantRole;
    page?: number;
    size?: number;
}

/** 내 매치 목록 조회 */
export function getMyMatches(
    params: GetMyMatchesParams = {},
): Promise<PageResponse<MyMatchResponse>> {
    const query = new URLSearchParams();
    if (params.sportType) query.set("sportType", params.sportType);
    if (params.myMatchStatus) query.set("myMatchStatus", params.myMatchStatus);
    if (params.role) query.set("role", params.role);
    query.set("page", String(params.page ?? 0));
    query.set("size", String(params.size ?? 10));

    return apiFetch<PageResponse<MyMatchResponse>>(
        `/api/v1/users/me/matches?${query.toString()}`,
        { auth: true },
    );
}

/** 내 매치 결제 내역 조회 */
export function getMatchPayment(
    matchId: string,
): Promise<MatchPaymentResponse> {
    return apiFetch<MatchPaymentResponse>(
        `/api/v1/users/me/matches/${matchId}/payment`,
        { auth: true },
    );
}