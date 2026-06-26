import { apiFetch, buildQuery } from "./http";
import type {
    PageResponse,
    SettlementItemResponse,
    SettlementSummaryResponse,
    SportType,
} from "./types";

/** GET /api/v1/admin/settlements/summary — 기간별 정산 요약. ADMIN 전용 */
export function getSettlementSummary(from: string, to: string) {
    return apiFetch<SettlementSummaryResponse>(
        `/api/v1/admin/settlements/summary${buildQuery({ from, to })}`,
        { auth: true },
    );
}

/** GET /api/v1/admin/settlements — 기간별 정산 내역(종목 필터·페이지네이션). ADMIN 전용 */
export function getSettlements(params: {
    from: string;
    to: string;
    sportType?: SportType;
    page?: number;
    size?: number;
    sort?: string;
}) {
    return apiFetch<PageResponse<SettlementItemResponse>>(
        `/api/v1/admin/settlements${buildQuery(params)}`,
        { auth: true },
    );
}