// components/ui/DashboardCard.tsx
import React, { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface DashboardCardProps {
    title: string;
    description?: string;
    icon?: ReactNode;
    footer?: ReactNode;
    className?: string;
    children?: ReactNode;
    onClick?: () => void;
}

export function DashboardCard({
    title,
    description,
    icon,
    footer,
    className,
    children,
    onClick,
}: DashboardCardProps) {
    return (
        <motion.div
            className={cn(
                "relative overflow-hidden rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md",
                onClick && "cursor-pointer",
                className
            )}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            onClick={onClick}
        >
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h3 className="flex items-center text-lg font-semibold text-gray-900">
                        {icon && <span className="mr-2">{icon}</span>}
                        {title}
                    </h3>
                    {description && (
                        <p className="mt-1 text-sm text-gray-500">{description}</p>
                    )}
                </div>
            </div>

            {children && <div className="mt-4">{children}</div>}

            {footer && <div className="mt-4">{footer}</div>}
        </motion.div>
    );
}

// カードグリッドコンポーネント
export function DashboardCardGrid({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                "grid gap-6 sm:grid-cols-2 lg:grid-cols-3",
                className
            )}
        >
            {children}
        </div>
    );
}