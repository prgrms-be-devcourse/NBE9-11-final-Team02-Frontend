"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
    { href: "/admin", label: "대시보드" },
    { href: "/admin/users", label: "회원 관리" },
    { href: "/admin/facilities", label: "경기장 관리" },
    { href: "/admin/settlements", label: "정산" },
];

/** 관리자 콘솔 상단 탭 네비게이션 */
export function AdminNav() {
    const pathname = usePathname();
    return (
        <nav className="admin-nav">
            {TABS.map((tab) => {
                const active =
                    tab.href === "/admin"
                        ? pathname === "/admin"
                        : pathname.startsWith(tab.href);
                return (
                    <Link
                        key={tab.href}
                        href={tab.href}
                        className={active ? "active" : undefined}
                    >
                        {tab.label}
                    </Link>
                );
            })}
        </nav>
    );
}