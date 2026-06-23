import { apiFetch } from "./http";
import { clearAccessToken, setAccessToken } from "./token";
import type {
    LoginRequest,
    LoginResponse,
    SignupRequest,
    SignupResponse,
    TokenRefreshResponse,
    UserProfile,
} from "./types";

/** 회원가입 */
export function signup(request: SignupRequest): Promise<SignupResponse> {
    return apiFetch<SignupResponse>("/api/v1/auth/signup", {
        method: "POST",
        body: request,
    });
}

/** 로그인 — 성공 시 accessToken 을 저장한다 */
export async function login(request: LoginRequest): Promise<LoginResponse> {
    const res = await apiFetch<LoginResponse>("/api/v1/auth/login", {
        method: "POST",
        body: request,
    });
    setAccessToken(res.accessToken);
    return res;
}

/** refreshToken 쿠키로 accessToken 재발급 */
export async function refresh(): Promise<string> {
    const res = await apiFetch<TokenRefreshResponse>("/api/v1/auth/refresh", {
        method: "POST",
    });
    setAccessToken(res.accessToken);
    return res.accessToken;
}

/** 로그아웃 — 서버 토큰 무효화 후 로컬 토큰 제거 */
export async function logout(): Promise<void> {
    try {
        await apiFetch<void>("/api/v1/auth/logout", { method: "POST", auth: true });
    } finally {
        clearAccessToken();
    }
}

/** 내 프로필 조회 */
export function getMyProfile(): Promise<UserProfile> {
    return apiFetch<UserProfile>("/api/v1/users/me", { auth: true });
}