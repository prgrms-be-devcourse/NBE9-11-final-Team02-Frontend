"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import {
    getMyProfile,
    login as loginApi,
    logout as logoutApi,
} from "./auth";
import { getAccessToken } from "./token";
import type { LoginRequest, UserProfile } from "./types";

interface AuthContextValue {
    user: UserProfile | null;
    /** 초기 프로필 로딩 여부 */
    loading: boolean;
    login: (request: LoginRequest) => Promise<void>;
    logout: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const refreshProfile = useCallback(async () => {
        if (!getAccessToken()) {
            setUser(null);
            return;
        }
        try {
            setUser(await getMyProfile());
        } catch {
            // 토큰 만료/무효 → 로그아웃 상태로 처리
            setUser(null);
        }
    }, []);

    useEffect(() => {
        let active = true;
        // 마운트 시 1회 초기 프로필 로딩 (외부 시스템 동기화) — 의도된 setState 호출
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void refreshProfile().finally(() => {
            if (active) setLoading(false);
        });
        return () => {
            active = false;
        };
    }, [refreshProfile]);

    const login = useCallback(
        async (request: LoginRequest) => {
            await loginApi(request);
            await refreshProfile();
        },
        [refreshProfile],
    );

    const logout = useCallback(async () => {
        await logoutApi();
        setUser(null);
    }, []);

    const value = useMemo(
        () => ({ user, loading, login, logout, refreshProfile }),
        [user, loading, login, logout, refreshProfile],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error("useAuth 는 <AuthProvider> 내부에서만 사용할 수 있습니다.");
    }
    return ctx;
}