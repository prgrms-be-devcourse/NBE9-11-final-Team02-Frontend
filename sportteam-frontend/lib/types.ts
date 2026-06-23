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