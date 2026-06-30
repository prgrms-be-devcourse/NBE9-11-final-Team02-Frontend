"use client";

import Link from "next/link";
import Image from "next/image";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Field, FormError, Input, Select } from "@/components/ui";

const SLOT_DURATIONS = [30, 60, 90, 120, 150, 180, 210, 240];

function slotDurationLabel(minutes: number) {
    if (minutes < 60) return `${minutes}분`;
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return rest === 0 ? `${hours}시간` : `${hours}시간 ${rest}분`;
}
import { AddressSearchInput } from "@/components/address-search-input";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/http";
import { createFacility } from "@/lib/manager-facility";
import { uploadImage } from "@/lib/s3";
import type { Amenity, SportType } from "@/lib/types";

const SPORTS: Array<[SportType, string]> = [
    ["FUTSAL", "풋살"],
    ["SOCCER", "축구"],
    ["BASKETBALL", "농구"],
    ["TENNIS", "테니스"],
    ["BADMINTON", "배드민턴"],
];
const AMENITIES: Array<[Amenity, string]> = [
    ["PARKING", "주차"],
    ["SHOWER", "샤워실"],
    ["LOCKER", "락커룸"],
    ["EQUIPMENT_RENTAL", "장비 대여"],
];

export default function NewFacilityPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [error, setError] = useState<string>();
    const [saving, setSaving] = useState(false);
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const [address, setAddress] = useState("");

    async function handleFiles(event: React.ChangeEvent<HTMLInputElement>) {
        const files = Array.from(event.target.files ?? []);
        event.target.value = ""; // 같은 파일 재선택 허용
        if (files.length === 0) return;

        setUploading(true);
        setError(undefined);
        try {
            const urls = await Promise.all(files.map((file) => uploadImage(file)));
            setImageUrls((prev) => [...prev, ...urls]);
        } catch (e) {
            setError(e instanceof Error ? e.message : "이미지 업로드에 실패했습니다.");
        } finally {
            setUploading(false);
        }
    }

    function removeImage(url: string) {
        setImageUrls((prev) => prev.filter((u) => u !== url));
    }

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!user) return;
        setSaving(true);
        setError(undefined);
        const data = new FormData(event.currentTarget);
        try {
            const facility = await createFacility(user.userId, {
                name: String(data.get("name")),
                address: String(data.get("address")),
                phone: String(data.get("phone") ?? ""),
                description: String(data.get("description") ?? ""),
                capacity: Number(data.get("capacity")),
                slotDurationMinutes: Number(data.get("slotDurationMinutes")),
                defaultWeekdayPrice: Number(data.get("defaultWeekdayPrice")),
                defaultWeekendPrice: Number(data.get("defaultWeekendPrice")),
                slotOpenAt: null,
                sportTypes: data.getAll("sportTypes") as SportType[],
                amenities: data.getAll("amenities") as Amenity[],
                imageUrls,
            });
            router.push(`/manager/facilities/${facility.id}/slots?created=1`);
        } catch (e) {
            setError(
                e instanceof ApiError
                    ? e.message
                    : e instanceof Error
                        ? e.message
                        : "경기장을 등록하지 못했습니다.",
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <main className="manager-page">
            <div className="manager-form-shell">
                <Link href="/manager/facilities" className="flow-back">
                    ← 내 경기장
                </Link>
                <div className="flow-heading">
                    <span>NEW FACILITY</span>
                    <h1>새 경기장 등록</h1>
                    <p>기본 운영 정보를 입력해주세요. 등록 후 예약 슬롯을 설정할 수 있습니다.</p>
                </div>
                <form className="manager-form" onSubmit={submit}>
                    <FormError message={error} />

                    <div className="flow-grid">
                        <Field label="경기장 이름" htmlFor="name">
                            <Input id="name" name="name" required placeholder="예: 플레이온 풋살 파크" />
                        </Field>
                        <Field label="연락처" htmlFor="phone">
                            <Input id="phone" name="phone" placeholder="02-1234-5678" />
                        </Field>
                    </div>

                    <Field label="주소" htmlFor="address">
                        <AddressSearchInput
                            id="address"
                            name="address"
                            value={address}
                            required
                            onChange={setAddress}
                        />
                    </Field>

                    <label className="manager-field">
                        시설 소개
                        <textarea name="description" placeholder="시설 특징과 이용 안내를 입력해주세요." />
                    </label>

                    <div className="flow-grid">
                        <Field label="수용 인원" htmlFor="capacity">
                            <Input id="capacity" name="capacity" type="number" min={1} defaultValue={10} required />
                        </Field>
                        <Field label="슬롯 단위" htmlFor="slotDurationMinutes">
                            <Select id="slotDurationMinutes" name="slotDurationMinutes" defaultValue={60} required>
                                {SLOT_DURATIONS.map((minutes) => (
                                    <option key={minutes} value={minutes}>
                                        {slotDurationLabel(minutes)}
                                    </option>
                                ))}
                            </Select>
                        </Field>
                        <Field label="평일 기본 요금" htmlFor="defaultWeekdayPrice">
                            <Input id="defaultWeekdayPrice" name="defaultWeekdayPrice" type="number" min={0} defaultValue={50000} required />
                        </Field>
                        <Field label="주말 기본 요금" htmlFor="defaultWeekendPrice">
                            <Input id="defaultWeekendPrice" name="defaultWeekendPrice" type="number" min={0} defaultValue={70000} required />
                        </Field>
                    </div>

                    <fieldset className="manager-checks">
                        <legend>지원 종목</legend>
                        {SPORTS.map(([value, label]) => (
                            <label key={value}>
                                <input type="checkbox" name="sportTypes" value={value} />
                                <span>{label}</span>
                            </label>
                        ))}
                    </fieldset>

                    <fieldset className="manager-checks">
                        <legend>편의 시설</legend>
                        {AMENITIES.map(([value, label]) => (
                            <label key={value}>
                                <input type="checkbox" name="amenities" value={value} />
                                <span>{label}</span>
                            </label>
                        ))}
                    </fieldset>

                    <div className="manager-field">
                        경기장 이미지
                        <div className="facility-image-upload">
                            <label className="facility-image-add">
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleFiles}
                                    disabled={uploading}
                                />
                                <span>{uploading ? "업로드 중…" : "+ 이미지 선택"}</span>
                            </label>
                            {imageUrls.map((url) => (
                                <div key={url} className="facility-image-thumb">
                                    <Image src={url} alt="" fill sizes="96px" unoptimized />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(url)}
                                        aria-label="이미지 삭제"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                        <small>JPG·PNG 이미지를 여러 장 업로드할 수 있어요. 첫 번째 이미지가 대표 이미지로 사용됩니다.</small>
                    </div>

                    <Button type="submit" loading={saving} disabled={uploading}>
                        경기장 등록하기
                    </Button>
                </form>
            </div>
        </main>
    );
}
