// 폼에서 공통으로 쓰는 작은 UI 컴포넌트 모음 (Tailwind v4)
import type { ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes } from "react";

function cn(...classes: Array<string | false | undefined>): string {
    return classes.filter(Boolean).join(" ");
}

interface FieldProps {
    label: string;
    htmlFor: string;
    error?: string;
    children: React.ReactNode;
}

export function Field({ label, htmlFor, error, children }: FieldProps) {
    return (
        <div className="flex flex-col gap-1.5">
            <label htmlFor={htmlFor} className="text-sm font-medium text-zinc-700">
                {label}
            </label>
            {children}
            {error ? <p className="text-xs text-red-600">{error}</p> : null}
        </div>
    );
}

const controlBase =
    "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 " +
    "placeholder:text-zinc-400 outline-none transition focus:border-zinc-900 focus:ring-2 " +
    "focus:ring-zinc-900/10 disabled:cursor-not-allowed disabled:opacity-60";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
    return <input className={cn(controlBase, className)} {...props} />;
}

export function Select({
                           className,
                           children,
                           ...props
                       }: SelectHTMLAttributes<HTMLSelectElement>) {
    return (
        <select className={cn(controlBase, className)} {...props}>
            {children}
        </select>
    );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    loading?: boolean;
}

export function Button({
                           className,
                           loading,
                           disabled,
                           children,
                           ...props
                       }: ButtonProps) {
    return (
        <button
            className={cn(
                "inline-flex w-full items-center justify-center rounded-lg bg-zinc-900 px-4 py-2.5 " +
                "text-sm font-semibold text-white transition hover:bg-zinc-800 " +
                "disabled:cursor-not-allowed disabled:opacity-60",
                className,
            )}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? "처리 중…" : children}
        </button>
    );
}

export function FormError({ message }: { message?: string }) {
    if (!message) return null;
    return (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
            {message}
        </div>
    );
}