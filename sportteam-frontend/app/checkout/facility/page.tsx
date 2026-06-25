"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { Button, FormError } from "@/components/ui";
import { RequireAuth } from "@/components/require-auth";
import { useAuth } from "@/lib/auth-context";
import {
    confirmPayment,
    getQueueStatus,
    issueQueueToken,
    prepareFacilityPayment,
    requestTossPayment,
} from "@/lib/payment";
import type { WaitingQueueTokenResponse } from "@/lib/types";

const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY ?? "";

export default function FacilityCheckoutPage() {
    return (
        <RequireAuth>
            <Suspense fallback={<CheckoutLoading />}>
                <FacilityCheckout />
            </Suspense>
        </RequireAuth>
    );
}

function FacilityCheckout() {
    const search = useSearchParams();
    const router = useRouter();
    const { user } = useAuth();
    const matchId = search.get("matchId") ?? "";
    const slotId = search.get("slotId") ?? "";
    const facilityId = search.get("facilityId") ?? "";
    const date = search.get("date") ?? "";
    const startTime = search.get("startTime") ?? "";
    const endTime = search.get("endTime") ?? "";
    const amount = Number(search.get("amount") ?? 0);
    const paymentKey = search.get("paymentKey");
    const orderId = search.get("orderId");
    const approvedAmount = Number(search.get("amount") ?? amount);

    const [queue, setQueue] = useState<WaitingQueueTokenResponse>();
    const [error, setError] = useState<string>();
    const [message, setMessage] = useState<string>();
    const [loading, setLoading] = useState(false);

    const successUrl = useMemo(() => {
        if (typeof window === "undefined") return "";
        const url = new URL(window.location.href);
        url.searchParams.delete("paymentKey");
        url.searchParams.delete("orderId");
        return url.toString();
    }, []);

    useEffect(() => {
        if (!user || !paymentKey || !orderId || !approvedAmount) return;
        let active = true;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLoading(true);
        setError(undefined);
        confirmPayment({ userId: user.userId, paymentKey, orderId, amount: approvedAmount })
            .then(() => {
                if (!active) return;
                setMessage("방장 결제가 완료되었습니다. 생성된 매치 상세로 이동합니다.");
                router.replace(`/matches/${matchId}?payment=success`);
            })
            .catch((err) => {
                if (active) setError(err instanceof Error ? err.message : "결제 승인에 실패했습니다.");
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, [approvedAmount, matchId, orderId, paymentKey, router, user]);

    async function pay() {
        if (!user) return;
        setLoading(true);
        setError(undefined);
        setMessage(undefined);
        try {
            let current = queue ?? await issueQueueToken(slotId, user.userId);
            if (!current.enterable) current = await getQueueStatus(current.token);
            setQueue(current);
            if (!current.enterable) return;

            const prepared = await prepareFacilityPayment({
                facilitySlotId: slotId,
                amount,
                queueToken: current.token,
                userId: user.userId,
            });

            if (!TOSS_CLIENT_KEY) {
                setMessage(`주문서가 생성되었습니다. Toss client key 설정 후 결제를 진행하세요. 주문번호: ${prepared.merchantUid}`);
                return;
            }

            await requestTossPayment({
                clientKey: TOSS_CLIENT_KEY,
                amount: prepared.amount,
                orderId: prepared.merchantUid,
                orderName: "시설 예약 방장 결제",
                successUrl,
                failUrl: successUrl,
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : "결제를 처리하지 못했습니다.");
        } finally {
            setLoading(false);
        }
    }

    if (!matchId || !slotId || !amount) return <InvalidCheckout />;

    return (
        <main className="flow-page">
            <div className="flow-shell checkout-shell">
                <Link href={`/facilities/${facilityId}`} className="flow-back">← 경기장으로 돌아가기</Link>
                <div className="flow-heading">
                    <span>STEP 2 OF 2</span>
                    <h1>방장 결제를 완료해주세요</h1>
                    <p>대기열 입장 가능 상태를 확인한 뒤, 서버 주문서 기준으로 Toss 결제를 진행합니다.</p>
                </div>
                <section className="payment-summary">
                    <div className="payment-art">₩</div>
                    <dl>
                        <div><dt>이용 일시</dt><dd>{date} · {startTime.slice(0, 5)} ~ {endTime.slice(0, 5)}</dd></div>
                        <div><dt>결제 항목</dt><dd>시설 예약 방장 결제</dd></div>
                        <div className="payment-total"><dt>최종 결제 금액</dt><dd>{amount.toLocaleString()}원</dd></div>
                    </dl>
                </section>
                {queue ? (
                    <div className="queue-notice">
                        <b>{queue.enterable ? "입장 가능" : `현재 대기 순번 ${queue.position}번`}</b>
                        <p>대기 인원 {queue.waitingCount}명 · 만료 시각 {formatDate(queue.expiresAt)}</p>
                    </div>
                ) : null}
                <FormError message={error} />
                {message ? <p className="deadline-preview">{message}</p> : null}
                <Button type="button" loading={loading} onClick={pay}>
                    {queue && !queue.enterable ? "대기 순번 다시 확인" : "Toss 결제 진행"}
                </Button>
                <p className="dev-payment-note">웹훅 API는 프론트에서 호출하지 않으며, 결제 성공 후 confirm 응답을 기준으로 화면을 갱신합니다.</p>
            </div>
        </main>
    );
}

function formatDate(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("ko-KR", {
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
}

function InvalidCheckout() {
    return <main className="flow-page"><div className="flow-shell empty-flow"><h1>결제 정보가 올바르지 않습니다.</h1><Link href="/facilities">경기장 찾기</Link></div></main>;
}

function CheckoutLoading() {
    return <main className="auth-loading"><span className="auth-spinner" /><p>결제 정보를 불러오고 있어요</p></main>;
}