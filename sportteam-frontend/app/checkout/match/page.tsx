"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { RequireAuth } from "@/components/require-auth";
import { Button, FormError } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { prepareParticipationPayment, requestTossPayment } from "@/lib/payment";

const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY ?? "";

export default function MatchCheckoutPage() {
    return (
        <RequireAuth>
            <Suspense fallback={<CheckoutLoading />}>
                <MatchCheckout />
            </Suspense>
        </RequireAuth>
    );
}

function MatchCheckout() {
    const search = useSearchParams();
    const router = useRouter();
    const { user } = useAuth();
    const matchId = search.get("matchId") ?? "";
    const title = search.get("title") ?? "매치 참가";
    const amount = Number(search.get("amount") ?? 0);
    const [error, setError] = useState<string>();
    const [loading, setLoading] = useState(false);

    async function pay() {
        if (!user) return;
        setLoading(true);
        setError(undefined);
        try {
            const prepared = await prepareParticipationPayment({
                matchId,
                amount,
                userId: user.userId,
            });

            if (!TOSS_CLIENT_KEY) {
                throw new Error("배포 결제를 위한 Toss client key가 설정되지 않았습니다.");
            }

            const successUrl = new URL("/checkout/success", window.location.origin);
            successUrl.searchParams.set("matchId", matchId);
            successUrl.searchParams.set("paymentType", "participation");

            const failUrl = new URL("/checkout/fail", window.location.origin);
            failUrl.searchParams.set("matchId", matchId);

            await requestTossPayment({
                clientKey: TOSS_CLIENT_KEY,
                amount: prepared.amount,
                orderId: prepared.merchantUid,
                orderName: `PLAYON 매치 참가비 - ${title}`,
                successUrl: successUrl.toString(),
                failUrl: failUrl.toString(),
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : "참가비 결제를 처리하지 못했습니다.");
        } finally {
            setLoading(false);
        }
    }

    if (!matchId || !amount) return <InvalidCheckout />;

    return (
        <main className="flow-page">
            <div className="flow-shell checkout-shell">
                <Link href={`/matches/${matchId}`} className="flow-back">← 매치로 돌아가기</Link>
                <div className="flow-heading">
                    <span>PARTICIPATION PAYMENT</span>
                    <h1>참가비 결제를 완료해주세요</h1>
                    <p>결제가 완료되면 참가가 확정되고 방장이 참가 현황에서 확인할 수 있습니다.</p>
                </div>
                <section className="payment-summary">
                    <div className="payment-art">✓</div>
                    <dl>
                        <div>
                            <dt>매치</dt>
                            <dd>{title}</dd>
                        </div>
                        <div>
                            <dt>결제 항목</dt>
                            <dd>매치 참가비</dd>
                        </div>
                        <div className="payment-total">
                            <dt>최종 결제 금액</dt>
                            <dd>{amount.toLocaleString()}원</dd>
                        </div>
                    </dl>
                </section>
                <FormError message={error} />
                <Button type="button" loading={loading} onClick={pay}>
                    결제창으로 이동하기
                </Button>
                <p className="dev-payment-note">결제 성공 후 서버 승인 결과를 기준으로 참가 상태가 갱신됩니다.</p>
            </div>
        </main>
    );
}

function InvalidCheckout() {
    return (
        <main className="flow-page">
            <div className="flow-shell empty-flow">
                <h1>결제 정보가 올바르지 않습니다.</h1>
                <Link href="/matches">매치 찾기</Link>
            </div>
        </main>
    );
}

function CheckoutLoading() {
    return (
        <main className="auth-loading">
            <span className="auth-spinner" />
            <p>결제 정보를 불러오고 있어요.</p>
        </main>
    );
}
