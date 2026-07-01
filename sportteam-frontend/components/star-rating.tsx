"use client";

interface StarRatingProps {
    value: number | null;
    onChange: (value: number | null) => void;
}

export function StarRating({ value, onChange }: StarRatingProps) {
    return (
        <span className="star-rating">
            {[1, 2, 3, 4, 5].map((star) => {
                const fillPct =
                    value == null ? 0
                    : value >= star ? 100
                    : value >= star - 0.5 ? 42
                    : 0;

                return (
                    <span key={star} className="star-slot">
                        <span className="star-bg">★</span>
                        <span
                            className="star-fg"
                            style={{ clipPath: `inset(0 ${100 - fillPct}% 0 0)` }}
                        >
                            ★
                        </span>
                        <span
                            className="star-hit star-hit-left"
                            onClick={() => {
                                const v = star - 0.5;
                                onChange(value === v ? null : v);
                            }}
                        />
                        <span
                            className="star-hit star-hit-right"
                            onClick={() => {
                                onChange(value === star ? null : star);
                            }}
                        />
                    </span>
                );
            })}
            <span className="star-value">
                {value != null ? `${value}점` : "선택 안 함"}
            </span>
        </span>
    );
}
