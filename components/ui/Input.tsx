// components/ui/Input.tsx
import React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    helperText?: string;
    error?: string;
    icon?: React.ReactNode;
    iconPosition?: "left" | "right";
    fullWidth?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({
        className,
        label,
        helperText,
        error,
        icon,
        iconPosition = "left",
        fullWidth = false,
        ...props
    }, ref) => {
        return (
            <div className={cn("space-y-2", fullWidth && "w-full")}>
                {label && (
                    <label
                        htmlFor={props.id}
                        className="text-sm font-medium text-gray-700"
                    >
                        {label}
                    </label>
                )}
                <div className="relative">
                    {icon && iconPosition === "left" && (
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
                            {icon}
                        </div>
                    )}
                    <input
                        className={cn(
                            "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-50",
                            error && "border-red-500 focus:border-red-500 focus:ring-red-500",
                            icon && iconPosition === "left" && "pl-10",
                            icon && iconPosition === "right" && "pr-10",
                            className
                        )}
                        ref={ref}
                        {...props}
                    />
                    {icon && iconPosition === "right" && (
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                            {icon}
                        </div>
                    )}
                </div>
                {helperText && !error && (
                    <p className="text-xs text-gray-500">{helperText}</p>
                )}
                {error && <p className="text-xs text-red-500">{error}</p>}
            </div>
        );
    }
);

Input.displayName = "Input";

// テキストエリアコンポーネント
export interface TextareaProps
    extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    helperText?: string;
    error?: string;
    fullWidth?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, label, helperText, error, fullWidth = false, ...props }, ref) => {
        return (
            <div className={cn("space-y-2", fullWidth && "w-full")}>
                {label && (
                    <label
                        htmlFor={props.id}
                        className="text-sm font-medium text-gray-700"
                    >
                        {label}
                    </label>
                )}
                <textarea
                    className={cn(
                        "flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-gray-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-50",
                        error && "border-red-500 focus:border-red-500 focus:ring-red-500",
                        className
                    )}
                    ref={ref}
                    {...props}
                />
                {helperText && !error && (
                    <p className="text-xs text-gray-500">{helperText}</p>
                )}
                {error && <p className="text-xs text-red-500">{error}</p>}
            </div>
        );
    }
);

Textarea.displayName = "Textarea";

// チェックボックスコンポーネント
export interface CheckboxProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    description?: string;
    error?: string;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
    ({ className, label, description, error, ...props }, ref) => {
        return (
            <div className="flex items-start">
                <div className="flex items-center h-5">
                    <input
                        type="checkbox"
                        className={cn(
                            "h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500",
                            error && "border-red-500 focus:ring-red-500",
                            className
                        )}
                        ref={ref}
                        {...props}
                    />
                </div>
                <div className="ml-3 text-sm">
                    <label
                        htmlFor={props.id}
                        className={cn(
                            "font-medium text-gray-700",
                            props.disabled && "opacity-70"
                        )}
                    >
                        {label}
                    </label>
                    {description && (
                        <p className="text-gray-500">{description}</p>
                    )}
                    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
                </div>
            </div>
        );
    }
);

Checkbox.displayName = "Checkbox";

// セレクトコンポーネント
export interface SelectProps
    extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    helperText?: string;
    error?: string;
    options: { value: string; label: string }[];
    fullWidth?: boolean;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
    ({ className, label, helperText, error, options, fullWidth = false, ...props }, ref) => {
        return (
            <div className={cn("space-y-2", fullWidth && "w-full")}>
                {label && (
                    <label
                        htmlFor={props.id}
                        className="text-sm font-medium text-gray-700"
                    >
                        {label}
                    </label>
                )}
                <div className="relative">
                    <select
                        className={cn(
                            "flex h-10 w-full appearance-none rounded-md border border-gray-300 bg-white px-3 py-2 pr-10 text-sm shadow-sm transition-colors placeholder:text-gray-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-50",
                            error && "border-red-500 focus:border-red-500 focus:ring-red-500",
                            className
                        )}
                        ref={ref}
                        {...props}
                    >
                        {options.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                        <svg
                            className="h-4 w-4 fill-current"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                        >
                            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                        </svg>
                    </div>
                </div>
                {helperText && !error && (
                    <p className="text-xs text-gray-500">{helperText}</p>
                )}
                {error && <p className="text-xs text-red-500">{error}</p>}
            </div>
        );
    }
);

Select.displayName = "Select";

// フォームグループコンポーネント
export interface FormGroupProps {
    children: React.ReactNode;
    className?: string;
}

export function FormGroup({ children, className }: FormGroupProps) {
    return (
        <div className={cn("space-y-6", className)}>
            {children}
        </div>
    );
}

// フォームセクションコンポーネント
export interface FormSectionProps {
    title?: string;
    description?: string;
    children: React.ReactNode;
    className?: string;
}

export function FormSection({ title, description, children, className }: FormSectionProps) {
    return (
        <div className={cn("space-y-4", className)}>
            {(title || description) && (
                <div className="space-y-1">
                    {title && <h3 className="text-lg font-medium text-gray-900">{title}</h3>}
                    {description && <p className="text-sm text-gray-500">{description}</p>}
                </div>
            )}
            <div className="space-y-4">
                {children}
            </div>
        </div>
    );
}

// ラジオグループコンポーネント
export interface RadioOption {
    id: string;
    label: string;
    value: string;
    description?: string;
}

export interface RadioGroupProps {
    label?: string;
    options: RadioOption[];
    value: string;
    onChange: (value: string) => void;
    name: string;
    error?: string;
    helperText?: string;
    disabled?: boolean;
    inline?: boolean;
    className?: string;
}

export function RadioGroup({
    label,
    options,
    value,
    onChange,
    name,
    error,
    helperText,
    disabled = false,
    inline = false,
    className,
}: RadioGroupProps) {
    return (
        <div className={cn("space-y-2", className)}>
            {label && (
                <label className="text-sm font-medium text-gray-700">
                    {label}
                </label>
            )}
            <div className={cn("space-y-3", inline && "flex space-x-6 space-y-0")}>
                {options.map((option) => (
                    <div key={option.id} className="flex items-start">
                        <div className="flex items-center h-5">
                            <input
                                id={option.id}
                                name={name}
                                type="radio"
                                value={option.value}
                                checked={value === option.value}
                                onChange={(e) => onChange(e.target.value)}
                                disabled={disabled}
                                className={cn(
                                    "h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500",
                                    error && "border-red-500 focus:ring-red-500"
                                )}
                            />
                        </div>
                        <div className="ml-3 text-sm">
                            <label
                                htmlFor={option.id}
                                className={cn(
                                    "font-medium text-gray-700",
                                    disabled && "opacity-70"
                                )}
                            >
                                {option.label}
                            </label>
                            {option.description && (
                                <p className="text-gray-500">{option.description}</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            {helperText && !error && (
                <p className="text-xs text-gray-500">{helperText}</p>
            )}
            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    );
}

export { Input, Textarea, Select, Checkbox };