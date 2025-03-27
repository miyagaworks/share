// app/dashboard/share/page.tsx
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Spinner } from "@/components/ui/Spinner";
import Link from "next/link";
import { ShareOptionClient } from "@/components/dashboard/ShareOptionClient";
import { QrCodeClient } from "@/components/dashboard/QrCodeClient";
import { HiShare, HiLink, HiQrcode, HiExclamation } from "react-icons/hi";

export default async function SharePage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center mb-6">
                <HiShare className="h-8 w-8 text-gray-700 mr-3" />
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">共有設定</h1>
                    <p className="text-muted-foreground text-justify">
                        公開プロフィールの設定とQRコードの生成ができます
                    </p>
                </div>
            </div>

            <Suspense fallback={<SharePageSkeleton />}>
                <SharePageContent />
            </Suspense>
        </div>
    );
}

async function SharePageContent() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/auth/signin");
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
            profile: true,
        },
    });

    if (!user || !user.profile) {
        return (
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center mb-4">
                    <HiExclamation className="h-5 w-5 text-amber-500 mr-2" />
                    <h2 className="text-xl font-semibold">プロフィールが必要です</h2>
                </div>
                <p className="text-muted-foreground mb-4 text-justify">
                    QRコードを生成するには、まずプロフィールを作成してください。
                </p>
                <Link
                    href="/dashboard/profile"
                    className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                    プロフィール設定へ
                </Link>
            </div>
        );
    }

    const profileUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/${user.profile.slug}`;

    return (
        <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center mb-4">
                    <HiLink className="h-5 w-5 text-gray-700 mr-2" />
                    <h2 className="text-xl font-semibold">プロフィールURL</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-4 text-justify">
                    以下のURLであなたのプロフィールを共有できます
                </p>
                <div className="bg-muted p-3 rounded-md mb-4 break-all">
                    <p className="font-mono text-sm">{profileUrl}</p>
                </div>
                <ShareOptionClient profileUrl={profileUrl} />
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center mb-4">
                    <HiQrcode className="h-5 w-5 text-gray-700 mr-2" />
                    <h2 className="text-xl font-semibold">QRコード</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-4 text-justify">
                    このQRコードをスキャンすると、あなたのプロフィールページにアクセスできます。
                    読み取りやすくするために、黒または濃い色を選択してください。
                </p>
                <QrCodeClient profileUrl={profileUrl} />
            </div>
        </div>
    );
}

function SharePageSkeleton() {
    return (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col items-center justify-center min-h-[200px]">
                <Spinner size="lg" />
                <p className="text-sm text-muted-foreground mt-4">
                    共有情報を読み込んでいます...
                </p>
            </div>
        </div>
    );
}