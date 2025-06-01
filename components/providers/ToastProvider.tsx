"use client";
// components/providers/ToastProvider.tsx
import { Toaster } from "react-hot-toast";
export function ToastProvider() {
    return (
        <Toaster
            position="top-center"
            reverseOrder={false}
            gutter={8}
            containerClassName=""
            containerStyle={{}}
            toastOptions={{
                // 成功通知のスタイル設定
                success: {
                    duration: 3000,
                    style: {
                        background: "#10B981",
                        color: "#fff",
                    },
                },
                // エラー通知のスタイル設定
                error: {
                    duration: 4000,
                    style: {
                        background: "#EF4444",
                        color: "#fff",
                    },
                },
                // 通知のデフォルトスタイル
                style: {
                    maxWidth: "500px",
                    fontSize: "14px",
                    padding: "16px 24px",
                    borderRadius: "8px",
                    fontWeight: "500",
                },
            }}
        />
    );
}