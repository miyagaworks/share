"use client";

// components/shared/ImprovedSnsIcon.tsx
import React, { useEffect, useState } from "react";
import {
    FaYoutube,
    FaInstagram,
    FaTiktok,
    FaFacebook,
    FaPinterest,
} from "react-icons/fa";
import { SiThreads } from "react-icons/si";
import { RiTwitterXFill } from "react-icons/ri";

import { type SnsPlatform } from "@/types/sns";

interface ImprovedSnsIconProps {
    platform: SnsPlatform;
    size?: number;
    color?: "primary" | "white" | "default" | "original" | string;
    className?: string;
}

// SNS別の元のカラー
const SNS_COLORS: Record<string, string> = {
    line: "#06C755",
    youtube: "#FF0000",
    x: "#000000",
    instagram: "#E4405F",
    tiktok: "#000000",
    facebook: "#1877F2",
    pinterest: "#BD081C",
    threads: "#000000",
    note: "#000000",
};

export function ImprovedSnsIcon({
    platform,
    size = 24,
    color = "default",
    className = ""
}: ImprovedSnsIconProps) {
    const [lineSvgContent, setLineSvgContent] = useState<string | null>(null);
    const [noteSvgContent, setNoteSvgContent] = useState<string | null>(null);

    // LINEアイコンのSVGを読み込む
    useEffect(() => {
        if (platform === "line") {
            fetch("/line.svg")
                .then(response => response.text())
                .then(svgText => {
                    // クラス名を一意のものに変更してクラスの衝突を防ぐ
                    let modifiedSvg = svgText.replace(/\.st0\s*{/g, ".line-icon-st0 {");
                    modifiedSvg = modifiedSvg.replace(/class="st0"/g, 'class="line-icon-st0"');

                    // 色の設定
                    if (color === "original") {
                        // オリジナルカラーでは緑(#06C755)に設定
                        modifiedSvg = modifiedSvg.replace(
                            /\.line-icon-st0\s*{[^}]*}/,
                            ".line-icon-st0 { fill: #06C755; }"
                        );
                    } else if (color === "primary") {
                        // プライマリカラー用のCSS変数を使用
                        modifiedSvg = modifiedSvg.replace(
                            /\.line-icon-st0\s*{[^}]*}/,
                            ".line-icon-st0 { fill: var(--primary); }"
                        );
                    } else if (color === "white") {
                        // 白色
                        modifiedSvg = modifiedSvg.replace(
                            /\.line-icon-st0\s*{[^}]*}/,
                            ".line-icon-st0 { fill: white; }"
                        );
                    } else if (color !== "default") {
                        // 特定の色が指定されている場合はその色にする
                        modifiedSvg = modifiedSvg.replace(
                            /\.line-icon-st0\s*{[^}]*}/,
                            `.line-icon-st0 { fill: ${color}; }`
                        );
                    }

                    setLineSvgContent(modifiedSvg);
                })
                .catch(error => {
                    console.error("Error loading LINE SVG:", error);
                });
        }
    }, [platform, color]);

    // noteアイコンのSVGを読み込む
    useEffect(() => {
        if (platform === "note") {
            fetch("/note.svg")
                .then(response => response.text())
                .then(svgText => {
                    // クラス名を一意のものに変更してクラスの衝突を防ぐ
                    let modifiedSvg = svgText.replace(/\.st0\s*{/g, ".note-icon-st0 {");
                    modifiedSvg = modifiedSvg.replace(/class="st0"/g, 'class="note-icon-st0"');

                    // 色の設定
                    if (color === "original") {
                        // オリジナルカラーでは黒(#000000)に設定
                        modifiedSvg = modifiedSvg.replace(
                            /\.note-icon-st0\s*{[^}]*}/,
                            ".note-icon-st0 { fill: #000000; }"
                        );
                    } else if (color === "primary") {
                        // プライマリカラー用のCSS変数を使用
                        modifiedSvg = modifiedSvg.replace(
                            /\.note-icon-st0\s*{[^}]*}/,
                            ".note-icon-st0 { fill: var(--primary); }"
                        );
                    } else if (color === "white") {
                        // 白色
                        modifiedSvg = modifiedSvg.replace(
                            /\.note-icon-st0\s*{[^}]*}/,
                            ".note-icon-st0 { fill: white; }"
                        );
                    } else if (color !== "default") {
                        // 特定の色が指定されている場合はその色にする
                        modifiedSvg = modifiedSvg.replace(
                            /\.note-icon-st0\s*{[^}]*}/,
                            `.note-icon-st0 { fill: ${color}; }`
                        );
                    }

                    setNoteSvgContent(modifiedSvg);
                })
                .catch(error => {
                    console.error("Error loading note SVG:", error);
                });
        }
    }, [platform, color]);

    // カラーの決定
    let iconColor = "";
    let finalColor = "";

    if (color === "primary") {
        iconColor = "text-primary";
    } else if (color === "white") {
        iconColor = "text-white";
    } else if (color === "default") {
        iconColor = "text-foreground";
    } else if (color === "original") {
        // 元々のアイコンカラーを使用
        finalColor = SNS_COLORS[platform] || "#333333";
    } else {
        // 指定された色を使用
        finalColor = color;
    }

    // スタイルの設定
    const style = (finalColor)
        ? { color: finalColor, fontSize: size }
        : { fontSize: size };

    // LINEアイコンを特別扱い
    if (platform === "line") {
        if (lineSvgContent) {
            // SVGのサイズ調整
            return (
                <div
                    style={{
                        width: size,
                        height: size,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                    dangerouslySetInnerHTML={{
                        __html: lineSvgContent
                            .replace(/width="[^"]*"/, `width="${size}"`)
                            .replace(/height="[^"]*"/, `height="${size}"`)
                    }}
                    className={className}
                />
            );
        }
        // SVG読み込み中は空のdivを表示
        return <div style={{ width: size, height: size }}></div>;
    }

    // noteアイコンも特別扱い
    if (platform === "note") {
        if (noteSvgContent) {
            // SVGのサイズ調整
            return (
                <div
                    style={{
                        width: size,
                        height: size,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                    dangerouslySetInnerHTML={{
                        __html: noteSvgContent
                            .replace(/width="[^"]*"/, `width="${size}"`)
                            .replace(/height="[^"]*"/, `height="${size}"`)
                    }}
                    className={className}
                />
            );
        }
        // SVG読み込み中は空のdivを表示
        return <div style={{ width: size, height: size }}></div>;
    }

    // プラットフォームに応じたアイコンの選択
    const getIcon = () => {
        switch (platform) {
            case "youtube":
                return <FaYoutube style={style} className={`${iconColor} ${className}`} />;
            case "x":
                return <RiTwitterXFill style={style} className={`${iconColor} ${className}`} />;
            case "instagram":
                return <FaInstagram style={style} className={`${iconColor} ${className}`} />;
            case "tiktok":
                return <FaTiktok style={style} className={`${iconColor} ${className}`} />;
            case "facebook":
                return <FaFacebook style={style} className={`${iconColor} ${className}`} />;
            case "pinterest":
                return <FaPinterest style={style} className={`${iconColor} ${className}`} />;
            case "threads":
                return <SiThreads style={style} className={`${iconColor} ${className}`} />;
            default:
                return null;
        }
    };

    return getIcon();
}