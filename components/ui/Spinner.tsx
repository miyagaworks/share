// components/ui/Spinner.tsx
import { cn } from "@/lib/utils";
interface SpinnerProps {
    size?: "sm" | "md" | "lg";
    className?: string;
}
export function Spinner({ size = "md", className }: SpinnerProps) {
    return (
        <div
            className={cn(
                "inline-block animate-spin rounded-full border-2 border-solid border-current border-r-transparent",
                size === "sm" && "h-4 w-4",
                size === "md" && "h-6 w-6",
                size === "lg" && "h-8 w-8",
                className
            )}
            role="status"
        >
            <span className="sr-only">読み込み中...</span>
        </div>
    );
}