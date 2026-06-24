"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import type { UserRole } from "@/lib/types";

export function RequireRole({ role, children }: { role: UserRole; children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (loading) return;
        if (!user) router.replace("/login");
        else if (user.role !== role) router.replace(user.role === "MANAGER" ? "/manager/facilities" : "/mypage");
    }, [loading, role, router, user]);

    if (loading || !user || user.role !== role) {
        return <main className="auth-loading"><span className="auth-spinner"/><p>접근 권한을 확인하고 있어요.</p></main>;
    }
    return children;
}
