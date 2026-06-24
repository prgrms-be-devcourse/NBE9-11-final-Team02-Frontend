export type ApiResponse<T> = { success: boolean; data: T; error?: { code: string; message: string; status: number; path: string } };
export type Page<T> = { content: T[]; totalPages: number; totalElements: number; number: number; size: number; last: boolean };
export type MatchSummary = { matchId: string; title: string; sportType: string; currentCount: number; capacity: number; feePerPerson: number; minSkillLevel: string; maxSkillLevel: string; requiredGender: string; recruitDeadline: string; status: string };
export type FacilitySummary = { facilityId: string; name: string; address: string; defaultWeekdayPrice: number; defaultWeekendPrice: number; sportTypes: string[]; thumbnailUrl: string | null; ratingAvg: number; reviewCount: number };
