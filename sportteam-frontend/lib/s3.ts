import { apiFetch } from "./http";
import type { PresignedUrlResponse } from "./types";

/** GET /api/v1/s3/presigned-url — 업로드용 presigned URL 발급. 인증 필요(매니저만 업로드) */
export function getPresignedUrl(contentType: string) {
    return apiFetch<PresignedUrlResponse>(
        `/api/v1/s3/presigned-url?contentType=${encodeURIComponent(contentType)}`,
        { auth: true },
    );
}

/**
 * 이미지 파일을 S3에 직접 업로드하고 최종 접근 URL(fileUrl)을 반환한다.
 * 1) 백엔드에서 presigned URL 발급 → 2) 해당 URL로 PUT 직접 업로드.
 * PUT 요청은 백엔드 프록시가 아닌 S3 절대 URL로 직접 전송한다.
 */
export async function uploadImage(file: File): Promise<string> {
    const contentType = file.type || "application/octet-stream";
    const { uploadUrl, fileUrl } = await getPresignedUrl(contentType);

    let res: Response;
    try {
        res = await fetch(uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": contentType },
            body: file,
        });
    } catch {
        throw new Error("이미지 업로드에 실패했습니다. 네트워크 상태를 확인해주세요.");
    }

    if (!res.ok) {
        throw new Error("이미지 업로드에 실패했습니다. 잠시 후 다시 시도해주세요.");
    }
    return fileUrl;
}