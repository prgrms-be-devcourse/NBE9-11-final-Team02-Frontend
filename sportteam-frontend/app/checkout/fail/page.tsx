"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

export default function CheckoutFailPage() {
    return (
        <Suspense fallback={null}>
            <CheckoutFail />
        </Suspense>
    );
}

function CheckoutFail() {
    const search = useSearchParams();
    const code = search.get("code");
    const message = search.get("message");
    const matchId = search.get("matchId");

    return (
        <main className="flow-page">
            <div className="flow-shell empty-flow">
                <h1>결제가 완료되지 않았습니다.</h1>
                <p>
                    {message ?? "결제가 취소되었거나 승인에 실패했습니다."}
                    {code ? ` (${code})` : ""}
                </p>
                <Link href={matchId ? `/matches/${matchId}` : "/matches"}>매치로 돌아가기</Link>
            </div>
        </main>
    );
}
