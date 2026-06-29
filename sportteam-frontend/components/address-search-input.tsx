"use client";

import { useState } from "react";
import { Input } from "@/components/ui";

type DaumPostcodeData = {
    roadAddress: string;
    jibunAddress: string;
    zonecode: string;
    buildingName?: string;
    apartment?: "Y" | "N";
};

type DaumPostcode = new (options: {
    oncomplete(data: DaumPostcodeData): void;
}) => {
    open(): void;
};

declare global {
    interface Window {
        daum?: {
            Postcode: DaumPostcode;
        };
    }
}

interface AddressSearchInputProps {
    id: string;
    name: string;
    value: string;
    required?: boolean;
    placeholder?: string;
    onChange(value: string): void;
}

const POSTCODE_SCRIPT_SRC = "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";

function loadPostcodeScript() {
    return new Promise<void>((resolve, reject) => {
        if (window.daum?.Postcode) {
            resolve();
            return;
        }

        const existing = document.querySelector<HTMLScriptElement>(`script[src="${POSTCODE_SCRIPT_SRC}"]`);
        if (existing) {
            existing.addEventListener("load", () => resolve(), { once: true });
            existing.addEventListener("error", () => reject(new Error("주소 검색 스크립트를 불러오지 못했습니다.")), { once: true });
            return;
        }

        const script = document.createElement("script");
        script.src = POSTCODE_SCRIPT_SRC;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("주소 검색 스크립트를 불러오지 못했습니다."));
        document.body.appendChild(script);
    });
}

export function AddressSearchInput({
    id,
    name,
    value,
    required,
    placeholder = "도로명 주소를 검색해주세요",
    onChange,
}: AddressSearchInputProps) {
    const [error, setError] = useState<string>();

    async function openSearch() {
        setError(undefined);
        try {
            await loadPostcodeScript();
            new window.daum!.Postcode({
                oncomplete(data) {
                    const baseAddress = data.roadAddress || data.jibunAddress;
                    const extra = data.buildingName && data.apartment === "Y"
                        ? ` (${data.buildingName})`
                        : "";
                    onChange(`${baseAddress}${extra}`);
                },
            }).open();
        } catch (err) {
            setError(err instanceof Error ? err.message : "주소 검색을 열지 못했습니다.");
        }
    }

    return (
        <div className="flex flex-col gap-2">
            <div className="flex gap-2">
                <Input
                    id={id}
                    name={name}
                    value={value}
                    required={required}
                    placeholder={placeholder}
                    onChange={(event) => onChange(event.target.value)}
                />
                <button
                    type="button"
                    onClick={openSearch}
                    className="shrink-0 rounded-lg border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
                >
                    주소 검색
                </button>
            </div>
            {error ? <p className="text-xs text-red-600">{error}</p> : null}
        </div>
    );
}
