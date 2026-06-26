import type { ApiResponse } from "./types";
import { getAccessToken } from "./token";

export const API_BASE_URL =
    typeof window === "undefined"
        ? (process.env.BACKEND_API_URL ?? "http://3.36.243.212")
        : "/backend";

/** 백엔드 error 응답을 그대로 담는 에러 */
export class ApiError extends Error {
    readonly code: string;
    readonly status: number;
    readonly path?: string;

    constructor(message: string, code: string, status: number, path?: string) {
        super(message);
        this.name = "ApiError";
        this.code = code;
        this.status = status;
        this.path = path;
    }
}

interface RequestOptions extends Omit<RequestInit, "body"> {
    /** JSON 으로 직렬화할 본문 */
    body?: unknown;
    /** Authorization 헤더에 accessToken 자동 첨부 여부 (기본 false) */
    auth?: boolean;
}

/**
 * 백엔드 API 호출 공통 래퍼.
 * - 성공 시 ApiResponse.data 를 그대로 반환
 * - 실패 시 ApiError 를 throw
 * - refreshToken 쿠키 송수신을 위해 credentials: "include" 사용
 */
export async function apiFetch<T>(
    path: string,
    { body, auth = false, headers, ...init }: RequestOptions = {},
): Promise<T> {
    const finalHeaders = new Headers(headers);

    if (body !== undefined) {
        finalHeaders.set("Content-Type", "application/json");
    }
    if (auth) {
        const token = getAccessToken();
        if (token) {
            finalHeaders.set("Authorization", `Bearer ${token}`);
        }
    }

    let res: Response;
    try {
        res = await fetch(`${API_BASE_URL}${path}`, {
            ...init,
            headers: finalHeaders,
            credentials: "include",
            body: body !== undefined ? JSON.stringify(body) : undefined,
        });
    } catch {
        throw new ApiError(
            "서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.",
            "NETWORK_ERROR",
            0,
        );
    }

    // 본문이 없을 수 있는 응답(예: 204) 처리
    const text = await res.text();
    const payload = text ? (JSON.parse(text) as ApiResponse<T>) : null;

    if (!res.ok || (payload && payload.success === false)) {
        const error = payload?.error;
        throw new ApiError(
            error?.message ?? "요청 처리 중 오류가 발생했습니다.",
            error?.code ?? "UNKNOWN",
            error?.status ?? res.status,
            error?.path,
        );
    }

    return (payload?.data ?? null) as T;
}

/** 정의된 값(undefined·null·빈 문자열 제외)만 모아 쿼리스트링(`?a=1&b=2`)으로 만든다. */
export function buildQuery(params: object): string {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null || value === "") continue;
        query.set(key, String(value));
    }
    const qs = query.toString();
    return qs ? `?${qs}` : "";
}