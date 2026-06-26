import { apiFetch } from "./http";
import type {
    PaymentConfirmResponse,
    PaymentPrepareResponse,
    PaymentType,
    WaitingQueueTokenResponse,
} from "./types";

export function issueQueueToken(facilitySlotId: string) {
    return apiFetch<WaitingQueueTokenResponse>(
        `/api/v1/queue/facility-slots/${facilitySlotId}/tokens`,
        { method: "POST", auth: true },
    );
}

export function getQueueStatus(token: string) {
    return apiFetch<WaitingQueueTokenResponse>(`/api/v1/queue/tokens/${token}`, {
        auth: true,
    });
}

export function consumeQueueToken(token: string) {
    return apiFetch<void>(`/api/v1/queue/tokens/${token}/consume`, {
        method: "POST",
        auth: true,
    });
}

export function prepareParticipationPayment(input: {
    matchId: string;
    amount: number;
}) {
    return preparePayment({
        matchId: input.matchId,
        amount: input.amount,
        paymentType: "PARTICIPATION",
    });
}

export function prepareFacilityPayment(input: {
    facilitySlotId: string;
    amount: number;
    queueToken?: string;
}) {
    return preparePayment({
        facilitySlotId: input.facilitySlotId,
        amount: input.amount,
        paymentType: "FACILITY",
        queueToken: input.queueToken,
    });
}

function preparePayment(input: {
    matchId?: string;
    facilitySlotId?: string;
    amount: number;
    paymentType: PaymentType;
    queueToken?: string;
}) {
    const query = input.queueToken
        ? `?${new URLSearchParams({ queueToken: input.queueToken })}`
        : "";

    return apiFetch<PaymentPrepareResponse>(`/api/v1/payments/prepare${query}`, {
        method: "POST",
        auth: true,
        body: {
            matchId: input.matchId ?? null,
            facilitySlotId: input.facilitySlotId ?? null,
            amount: input.amount,
            paymentType: input.paymentType,
        },
    });
}

export function confirmPayment(input: {
    paymentKey: string;
    orderId: string;
    amount: number;
}) {
    return apiFetch<PaymentConfirmResponse>("/api/v1/payments/confirm", {
        method: "POST",
        auth: true,
        body: {
            paymentKey: input.paymentKey,
            orderId: input.orderId,
            amount: input.amount,
        },
    });
}

type TossPayments = {
    requestPayment(method: string, options: Record<string, unknown>): Promise<void>;
};

declare global {
    interface Window {
        TossPayments?: (clientKey: string) => TossPayments;
    }
}

export async function requestTossPayment(input: {
    clientKey: string;
    amount: number;
    orderId: string;
    orderName: string;
    successUrl: string;
    failUrl: string;
}) {
    await loadTossPaymentsScript();
    if (!window.TossPayments) {
        throw new Error("TossPayments 결제창을 불러오지 못했습니다.");
    }
    await window.TossPayments(input.clientKey).requestPayment("카드", {
        amount: input.amount,
        orderId: input.orderId,
        orderName: input.orderName,
        successUrl: input.successUrl,
        failUrl: input.failUrl,
    });
}

function loadTossPaymentsScript() {
    if (typeof window === "undefined") return Promise.resolve();
    if (window.TossPayments) return Promise.resolve();
    return new Promise<void>((resolve, reject) => {
        const existing = document.querySelector<HTMLScriptElement>(
            'script[src="https://js.tosspayments.com/v1/payment"]',
        );
        if (existing) {
            existing.addEventListener("load", () => resolve(), { once: true });
            existing.addEventListener("error", () => reject(new Error("Toss SDK 로드 실패")), { once: true });
            return;
        }
        const script = document.createElement("script");
        script.src = "https://js.tosspayments.com/v1/payment";
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Toss SDK 로드 실패"));
        document.head.appendChild(script);
    });
}