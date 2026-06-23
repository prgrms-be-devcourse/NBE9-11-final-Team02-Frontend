// 백엔드(Spring) 공통 응답 및 도메인 타입 정의

export type UserRole = "USER" | "MANAGER" | "ADMIN";
export type AuthProvider = "LOCAL" | "GOOGLE";

/** 백엔드 com.back.sportteam.global.response.ApiResponse 와 매칭 */
export interface ApiResponse<T> {
    success: boolean;
    data: T | null;
    error: ApiErrorInfo | null;
}

export interface ApiErrorInfo {
    code: string;
    message: string;
    status: number;
    path: string;
}

// ---- auth ----

export interface SignupRequest {
    email: string;
    password: string;
    nickname: string;
    role: UserRole;
    provider?: AuthProvider;
    providerId?: string;
}

export interface SignupResponse {
    userId: string;
    email: string;
    nickname: string;
    role: UserRole;
    provider: AuthProvider | null;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    accessToken: string;
    role: UserRole;
}

export interface TokenRefreshResponse {
    accessToken: string;
}

// ---- user ----

export interface UserProfile {
    userId: string;
    email: string;
    nickname: string;
    role: UserRole;
    provider: AuthProvider | null;
    profileImg: string | null;
    position: string | null;
    activeRegion: string | null;
    preferredSport: string | null;
    mannerScore: number | null;
    skillScore: number | null;
}

/** 프로필 수정 요청 — 모든 필드 선택적(부분 수정) */
export interface UserProfileUpdateRequest {
    nickname?: string;
    position?: string;
    activeRegion?: string;
    preferredSport?: string;
    profileImg?: string;
}

export interface UserProfileUpdateResponse {
    userId: string;
    nickname: string | null;
    position: string | null;
    activeRegion: string | null;
    preferredSport: string | null;
    profileImg: string | null;
}

// ---- facility ----

export type SportType =
    | "FUTSAL"
    | "SOCCER"
    | "BASKETBALL"
    | "TENNIS"
    | "BADMINTON";

export type FacilityStatus = "ACTIVE" | "CLOSED";

export type Amenity = "PARKING" | "SHOWER" | "LOCKER" | "EQUIPMENT_RENTAL";

export type SlotStatus = "AVAILABLE" | "RESERVED" | "BLOCKED";

/** Spring Data Page<T> 응답과 매칭 */
export interface PageResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
    first: boolean;
    last: boolean;
}

export interface FacilityAvailableResponse {
    facilityId: string;
    name: string;
    address: string;
    defaultWeekdayPrice: number;
    defaultWeekendPrice: number;
    sportTypes: SportType[];
    thumbnailUrl: string | null;
    ratingAvg: number;
    reviewCount: number;
}

export interface FacilityResponse {
    id: string;
    name: string;
    address: string;
    phone: string;
    description: string;
    capacity: number;
    slotDurationMinutes: number;
    defaultWeekdayPrice: number;
    defaultWeekendPrice: number;
    slotOpenAt: string;
    status: FacilityStatus;
    sportTypes: SportType[];
    amenities: Amenity[];
    imageUrls: string[];
    createdAt: string;
}

export interface FacilitySlotResponse {
    id: string;
    slotDate: string;
    startTime: string;
    endTime: string;
    price: number;
    status: SlotStatus;
}