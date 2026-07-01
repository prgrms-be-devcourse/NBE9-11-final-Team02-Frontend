"use client";

import Link from "next/link";
import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Field, FormError, Input, Select } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/http";
import {
    deleteFacility,
    deleteFacilityImage,
    getManagerFacility,
    updateFacility,
} from "@/lib/manager-facility";
import { uploadImage } from "@/lib/s3";
import { SLOT_DURATIONS, slotDurationLabel } from "@/lib/facility-slot-options";
import type {
    Amenity,
    FacilityResponse,
    FacilityUpdateRequest,
    SportType,
} from "@/lib/types";

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

interface FacilityImage {
    url: string;
    /** 서버에 이미 저장된 이미지인지(=즉시 삭제 API 호출 대상) */
    persisted: boolean;
}

export default function EditFacilityPage() {
    const params = useParams<{ facilityId: string }>();
    const facilityId = params.facilityId;
    const { user } = useAuth();
    const router = useRouter();

    const [facility, setFacility] = useState<FacilityResponse>();
    const [images, setImages] = useState<FacilityImage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>();
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (!user) return;
        let active = true;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLoading(true);
        setError(undefined);

        getManagerFacility(user.userId, facilityId)
            .then((res) => {
                if (!active) return;
                setFacility(res);
                setImages(res.imageUrls.map((url) => ({ url, persisted: true })));
            })
            .catch((e) => {
                if (active) {
                    setError(
                        e instanceof ApiError
                            ? e.message
                            : "경기장 정보를 불러오지 못했습니다.",
                    );
                }
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, [facilityId, user]);

    async function handleFiles(event: React.ChangeEvent<HTMLInputElement>) {
        const files = Array.from(event.target.files ?? []);
        event.target.value = "";
        if (files.length === 0) return;

        setUploading(true);
        setError(undefined);
        try {
            const urls = await Promise.all(files.map((file) => uploadImage(file)));
            setImages((prev) => [
                ...prev,
                ...urls.map((url) => ({ url, persisted: false })),
            ]);
        } catch (e) {
            setError(e instanceof Error ? e.message : "이미지 업로드에 실패했습니다.");
        } finally {
            setUploading(false);
        }
    }

    async function removeImage(target: FacilityImage) {
        if (!user) return;
        // 새로 올린(미저장) 이미지는 로컬에서만 제거
        if (!target.persisted) {
            setImages((prev) => prev.filter((i) => i.url !== target.url));
            return;
        }
        setError(undefined);
        try {
            await deleteFacilityImage(user.userId, facilityId, target.url);
            setImages((prev) => prev.filter((i) => i.url !== target.url));
        } catch (e) {
            setError(e instanceof Error ? e.message : "이미지를 삭제하지 못했습니다.");
        }
    }

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!user) return;
        setSaving(true);
        setError(undefined);
        const data = new FormData(event.currentTarget);
        const request: FacilityUpdateRequest = {
            phone: String(data.get("phone") ?? ""),
            description: String(data.get("description") ?? ""),
            capacity: Number(data.get("capacity")),
            slotDurationMinutes: Number(data.get("slotDurationMinutes")),
            defaultWeekdayPrice: Number(data.get("defaultWeekdayPrice")),
            defaultWeekendPrice: Number(data.get("defaultWeekendPrice")),
            slotOpenAt: null,
            sportTypes: data.getAll("sportTypes") as SportType[],
            amenities: data.getAll("amenities") as Amenity[],
            imageUrls: images.map((i) => i.url),
        };
        try {
            await updateFacility(user.userId, facilityId, request);
            router.push("/manager/facilities");
        } catch (e) {
            setError(
                e instanceof Error ? e.message : "경기장 정보를 수정하지 못했습니다.",
            );
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete() {
        if (!user) return;
        if (
            !window.confirm(
                "경기장을 삭제하면 복구할 수 없습니다. 정말 삭제할까요?",
            )
        ) {
            return;
        }
        setSaving(true);
        setError(undefined);
        try {
            await deleteFacility(user.userId, facilityId);
            router.push("/manager/facilities");
        } catch (e) {
            setError(e instanceof Error ? e.message : "경기장을 삭제하지 못했습니다.");
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <main className="auth-loading">
                <span className="auth-spinner" />
                <p>경기장 정보를 불러오고 있어요.</p>
            </main>
        );
    }

    if (error && !facility) {
        return (
            <main className="manager-page">
                <div className="manager-form-shell">
                    <p className="manager-error">{error}</p>
                    <Link href="/manager/facilities" className="flow-back">
                        ← 내 경기장
                    </Link>
                </div>
            </main>
        );
    }

    if (!facility) return null;

    return (
        <main className="manager-page">
            <div className="manager-form-shell">
                <Link href="/manager/facilities" className="flow-back">
                    ← 내 경기장
                </Link>
                <div className="flow-heading">
                    <span>EDIT FACILITY</span>
                    <h1>경기장 정보 수정</h1>
                    <p>운영 정보를 변경합니다. 이름과 주소는 변경할 수 없습니다.</p>
                </div>
                <form className="manager-form" onSubmit={submit}>
                    <FormError message={error} />

                    <div className="manager-readonly">
                        <div>
                            <span>경기장 이름</span>
                            <b>{facility.name}</b>
                        </div>
                        <div>
                            <span>주소</span>
                            <b>{facility.address}</b>
                        </div>
                    </div>

                    <Field label="연락처" htmlFor="phone">
                        <Input
                            id="phone"
                            name="phone"
                            defaultValue={facility.phone ?? ""}
                            placeholder="02-1234-5678"
                        />
                    </Field>

                    <label className="manager-field">
                        시설 소개
                        <textarea
                            name="description"
                            defaultValue={facility.description ?? ""}
                            placeholder="시설 특징과 이용 안내를 입력해주세요."
                        />
                    </label>

                    <div className="flow-grid">
                        <Field label="수용 인원" htmlFor="capacity">
                            <Input id="capacity" name="capacity" type="number" min={1} defaultValue={facility.capacity} required />
                        </Field>
                        <Field label="슬롯 단위" htmlFor="slotDurationMinutes">
                            <Select id="slotDurationMinutes" name="slotDurationMinutes" defaultValue={facility.slotDurationMinutes} required>
                                {SLOT_DURATIONS.map((minutes) => (
                                    <option key={minutes} value={minutes}>
                                        {slotDurationLabel(minutes)}
                                    </option>
                                ))}
                            </Select>
                        </Field>
                        <Field label="평일 기본 요금" htmlFor="defaultWeekdayPrice">
                            <Input id="defaultWeekdayPrice" name="defaultWeekdayPrice" type="number" min={0} defaultValue={facility.defaultWeekdayPrice} required />
                        </Field>
                        <Field label="주말 기본 요금" htmlFor="defaultWeekendPrice">
                            <Input id="defaultWeekendPrice" name="defaultWeekendPrice" type="number" min={0} defaultValue={facility.defaultWeekendPrice} required />
                        </Field>
                        <p className="text-sm text-muted-foreground">기본 요금 수정 시, 예약 전인 기존 슬롯에 가격 변동이 반영됩니다.</p>
                    </div>

                    <fieldset className="manager-checks">
                        <legend>지원 종목</legend>
                        {SPORTS.map(([value, label]) => (
                            <label key={value}>
                                <input
                                    type="checkbox"
                                    name="sportTypes"
                                    value={value}
                                    defaultChecked={facility.sportTypes.includes(value)}
                                />
                                <span>{label}</span>
                            </label>
                        ))}
                    </fieldset>

                    <fieldset className="manager-checks">
                        <legend>편의 시설</legend>
                        {AMENITIES.map(([value, label]) => (
                            <label key={value}>
                                <input
                                    type="checkbox"
                                    name="amenities"
                                    value={value}
                                    defaultChecked={facility.amenities.includes(value)}
                                />
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
                            {images.map((image) => (
                                <div key={image.url} className="facility-image-thumb">
                                    <Image src={image.url} alt="" fill sizes="96px" unoptimized />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(image)}
                                        aria-label="이미지 삭제"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                        <small>이미지를 추가하거나 × 버튼으로 삭제할 수 있습니다.</small>
                    </div>

                    <Button type="submit" loading={saving} disabled={uploading}>
                        변경 사항 저장
                    </Button>
                    <button
                        type="button"
                        className="manager-delete-button"
                        onClick={handleDelete}
                        disabled={saving}
                    >
                        경기장 삭제
                    </button>
                </form>
            </div>
        </main>
    );
}