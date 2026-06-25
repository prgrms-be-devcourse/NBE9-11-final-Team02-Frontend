// accessToken 클라이언트 보관 (refreshToken 은 백엔드가 httpOnly 쿠키로 관리)
//
// NOTE: 데모/개발 단계에서는 localStorage 를 사용한다. 운영에서는 XSS 노출을 줄이기 위해
// 메모리 + refresh 쿠키 전략으로 옮기는 것을 권장한다.

const ACCESS_TOKEN_KEY = "sportteam.accessToken";

export function getAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string): void {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearAccessToken(): void {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
}