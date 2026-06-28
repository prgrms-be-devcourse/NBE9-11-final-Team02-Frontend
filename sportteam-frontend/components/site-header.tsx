"use client";

import { usePathname } from "next/navigation";
import { Header } from "./header";

/** 전역 헤더가 어울리지 않는(자체 풀스크린 레이아웃) 경로 */
const HIDDEN_PREFIXES = ["/login", "/signup"];

/** 로그인/회원가입을 제외한 모든 페이지에 공통 헤더를 렌더 */
export function SiteHeader() {
    const pathname = usePathname();
    const hidden = HIDDEN_PREFIXES.some(
        (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );
    if (hidden) return null;
    return <Header />;
}