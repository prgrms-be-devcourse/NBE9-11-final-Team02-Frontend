import Link from "next/link";

export default function AuthLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 py-12">
            <div className="w-full max-w-sm">
                <Link href="/" className="mb-8 block text-center">
          <span className="text-2xl font-bold tracking-tight text-zinc-900">
            SportTeam
          </span>
                </Link>
                <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
                    {children}
                </div>
            </div>
        </div>
    );
}