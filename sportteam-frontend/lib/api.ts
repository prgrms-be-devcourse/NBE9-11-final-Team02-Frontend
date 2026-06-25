import type { ApiResponse, FacilityAvailableResponse, MatchSummaryResponse, PageResponse } from "./types";

const API_URL = process.env.BACKEND_API_URL ?? "http://localhost:8090";

async function apiGet<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${API_URL}${path}`, { next: { revalidate: 30 }, signal: AbortSignal.timeout(2500) });
    if (!response.ok) return null;
    const body = await response.json() as ApiResponse<T>;
    return body.success ? body.data : null;
  } catch { return null; }
}

function query(params: Record<string, string | undefined>) { const search = new URLSearchParams(); Object.entries(params).forEach(([key, value]) => value && search.set(key, value)); return search.toString(); }

export async function getMatches(params: Record<string, string | undefined> = {}) {
  const data = await apiGet<PageResponse<MatchSummaryResponse>>(`/api/v1/matches?${query(params)}`);
  return data?.content?.length ? data.content : fallbackMatches;
}

export async function getAvailableFacilities(params: Record<string, string | undefined> = {}) {
  const data = await apiGet<PageResponse<FacilityAvailableResponse>>(`/api/v1/facilities/available?${query(params)}`);
  return data?.content?.length ? data.content : fallbackFacilities;
}

const future = (days: number, hour: number) => { const date = new Date(); date.setDate(date.getDate() + days); date.setHours(hour, 0, 0, 0); return date.toISOString(); };
const fallbackMatches: MatchSummaryResponse[] = [
  { matchId: "demo-1", title: "퇴근 후 가볍게 풋살 한 게임!", sportType: "FUTSAL", currentCount: 8, capacity: 10, feePerPerson: 12000, minSkillLevel: "LEVEL_1", maxSkillLevel: "LEVEL_3", requiredGender: "ANY", recruitDeadline: future(1, 20), status: "RECRUITING" },
  { matchId: "demo-2", title: "주말 오전 3:3 농구 같이 해요", sportType: "BASKETBALL", currentCount: 4, capacity: 6, feePerPerson: 8000, minSkillLevel: "LEVEL_1", maxSkillLevel: "LEVEL_5", requiredGender: "ANY", recruitDeadline: future(2, 10), status: "RECRUITING" },
  { matchId: "demo-3", title: "랠리 위주 배드민턴 복식", sportType: "BADMINTON", currentCount: 2, capacity: 4, feePerPerson: 9000, minSkillLevel: "LEVEL_2", maxSkillLevel: "LEVEL_5", requiredGender: "ANY", recruitDeadline: future(3, 19), status: "RECRUITING" },
  { matchId: "demo-4", title: "초보 환영! 일요일 테니스", sportType: "TENNIS", currentCount: 3, capacity: 6, feePerPerson: 15000, minSkillLevel: "LEVEL_1", maxSkillLevel: "LEVEL_3", requiredGender: "ANY", recruitDeadline: future(4, 14), status: "RECRUITING" },
];
const fallbackFacilities: FacilityAvailableResponse[] = [
  { facilityId: "demo-f1", name: "서울 풋살 파크 성수", address: "서울 성동구 성수이로 88", defaultWeekdayPrice: 60000, defaultWeekendPrice: 80000, sportTypes: ["FUTSAL", "SOCCER"], thumbnailUrl: null, ratingAvg: 4.9, reviewCount: 128 },
  { facilityId: "demo-f2", name: "바운드 농구 코트", address: "서울 마포구 월드컵북로 21", defaultWeekdayPrice: 50000, defaultWeekendPrice: 65000, sportTypes: ["BASKETBALL"], thumbnailUrl: null, ratingAvg: 4.8, reviewCount: 94 },
  { facilityId: "demo-f3", name: "스매시 배드민턴 센터", address: "서울 송파구 올림픽로 35", defaultWeekdayPrice: 18000, defaultWeekendPrice: 22000, sportTypes: ["BADMINTON"], thumbnailUrl: null, ratingAvg: 4.7, reviewCount: 76 },
];
