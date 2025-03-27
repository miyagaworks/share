// components/ui/EnhancedColorPicker.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import tinycolor from "tinycolor2";

interface EnhancedColorPickerProps {
    color: string;
    onChange: (color: string) => void;
    disabled?: boolean;
}

export function EnhancedColorPicker({
    color,
    onChange,
    disabled = false,
}: EnhancedColorPickerProps) {
    const [inputValue, setInputValue] = useState(color);
    const [isOpen, setIsOpen] = useState(false);
    const [hue, setHue] = useState(0);
    const [saturation, setSaturation] = useState(100);
    const [lightness, setLightness] = useState(50);
    const pickerRef = useRef<HTMLDivElement>(null);

    // 初期カラーに基づいてHSLを設定
    useEffect(() => {
        if (color) {
            const tc = tinycolor(color);
            const hsl = tc.toHsl();
            setHue(Math.round(hsl.h));
            setSaturation(Math.round(hsl.s * 100));
            setLightness(Math.round(hsl.l * 100));
            setInputValue(tc.toHexString());
        }
    }, [color]);

    // 外部クリックでピッカーを閉じる
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [pickerRef]);

    // HSL値からカラーを更新する関数
    const updateColorFromHsl = () => {
        const newColor = tinycolor({ h: hue, s: saturation / 100, l: lightness / 100 }).toHexString();
        setInputValue(newColor);
        onChange(newColor);
    };

    // 色相スライダーの変更ハンドラー
    const handleHueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setHue(parseInt(e.target.value));
        updateColorFromHsl();
    };

    // 彩度スライダーの変更ハンドラー
    const handleSaturationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSaturation(parseInt(e.target.value));
        updateColorFromHsl();
    };

    // 明度スライダーの変更ハンドラー
    const handleLightnessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLightness(parseInt(e.target.value));
        updateColorFromHsl();
    };

    // カラーコード入力の変更ハンドラー
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInputValue(value);

        // 有効なカラーコードの場合のみonChangeを呼び出し
        if (tinycolor(value).isValid()) {
            const newColor = tinycolor(value).toHexString();
            onChange(newColor);

            // HSL値も更新
            const hsl = tinycolor(newColor).toHsl();
            setHue(Math.round(hsl.h));
            setSaturation(Math.round(hsl.s * 100));
            setLightness(Math.round(hsl.l * 100));
        }
    };

    return (
        <div className="space-y-4" ref={pickerRef}>
            <div className="flex items-center space-x-2">
                <div
                    className={cn(
                        "w-10 h-10 rounded-md border border-input cursor-pointer",
                        disabled && "opacity-50 cursor-not-allowed"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                />
                <input
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onBlur={() => {
                        // 無効な色の場合、前の値に戻す
                        if (!tinycolor(inputValue).isValid()) {
                            setInputValue(color);
                        }
                    }}
                    disabled={disabled}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="#RRGGBB"
                    maxLength={7}
                />
            </div>

            {isOpen && (
                <div className="p-4 bg-background rounded-md border border-input shadow-md">
                    {/* 色相スライダー */}
                    <div className="space-y-2 mb-4">
                        <label className="text-xs text-muted-foreground">色相</label>
                        <div
                            className="h-6 w-full rounded-md mb-1"
                            style={{
                                background: "linear-gradient(to right, #FF0000, #FFFF00, #00FF00, #00FFFF, #0000FF, #FF00FF, #FF0000)"
                            }}
                        />
                        <input
                            type="range"
                            min="0"
                            max="360"
                            value={hue}
                            onChange={handleHueChange}
                            className="w-full"
                        />
                    </div>

                    {/* 彩度スライダー */}
                    <div className="space-y-2 mb-4">
                        <label className="text-xs text-muted-foreground">彩度</label>
                        <div
                            className="h-6 w-full rounded-md mb-1"
                            style={{
                                background: `linear-gradient(to right, ${tinycolor({ h: hue, s: 0, l: lightness / 100 }).toHexString()}, ${tinycolor({ h: hue, s: 1, l: lightness / 100 }).toHexString()})`
                            }}
                        />
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={saturation}
                            onChange={handleSaturationChange}
                            className="w-full"
                        />
                    </div>

                    {/* 明度スライダー */}
                    <div className="space-y-2 mb-4">
                        <label className="text-xs text-muted-foreground">明度</label>
                        <div
                            className="h-6 w-full rounded-md mb-1"
                            style={{
                                background: `linear-gradient(to right, #000000, ${tinycolor({ h: hue, s: saturation / 100, l: 0.5 }).toHexString()}, #FFFFFF)`
                            }}
                        />
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={lightness}
                            onChange={handleLightnessChange}
                            className="w-full"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}