"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { RequireAuth } from "@/components/require-auth";
import { FormError } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { confirmPayment } from "@/lib/payment";

export default function CheckoutSuccessPage() {
    return (
        <RequireAuth>
            <Suspense fallback={<CheckoutConfirming />}>
                <CheckoutSuccess />
            </Suspense>
        </RequireAuth>
    );
}

function CheckoutSuccess() {
    const search = useSearchParams();
    const router = useRouter();
    const { user } = useAuth();
    const [error, setError] = useState<string>();

    const paymentKey = search.get("paymentKey") ?? "";
    const orderId = search.get("orderId") ?? "";
    const amount = Number(search.get("amount") ?? 0);
    const matchId = search.get("matchId") ?? "";
    const invalidPaymentMessage = !paymentKey || !orderId || !amount || !matchId
        ? "결제 승인 정보가 올바르지 않습니다."
        : undefined;

    useEffect(() => {
        if (!user || invalidPaymentMessage) return;

        let active = true;
        confirmPayment({
            paymentKey,
            orderId,
            amount,
        })
            .then(() => {
                if (active) router.replace(`/matches/${matchId}?payment=success`);
            })
            .catch((err) => {
                if (active) setError(err instanceof Error ? err.message : "결제 승인에 실패했습니다.");
            });

        return () => {
            active = false;
        };
    }, [amount, invalidPaymentMessage, matchId, orderId, paymentKey, router, user]);

    const displayError = error ?? invalidPaymentMessage;

    if (displayError) {
        return (
            <main className="flow-page">
                <div className="flow-shell empty-flow">
                    <h1>결제 승인에 실패했습니다.</h1>
                    <FormError message={displayError} />
                    <Link href={matchId ? `/matches/${matchId}` : "/matches"}>매치로 돌아가기</Link>
                </div>
            </main>
        );
    }

    return <CheckoutConfirming />;
}

function CheckoutConfirming() {
    return (
        <main className="auth-loading">
            <span className="auth-spinner" />
            <p>결제를 승인하고 있어요.</p>
        </main>
    );
}