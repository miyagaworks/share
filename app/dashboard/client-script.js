"use client";

// クライアントサイドで実行するスクリプト
// このファイルはlayout.tsxなどでインポートする

// DOMContentLoadedイベントでURLを更新
document.addEventListener('DOMContentLoaded', () => {
    // URLコンテナを見つける
    const containers = document.querySelectorAll('.client-profile-url');

    containers.forEach(container => {
        // data-url属性からプロファイルURLを取得
        const profileUrl = container.getAttribute('data-url');
        if (profileUrl) {
            // 子要素のpタグを見つける
            const paragraph = container.querySelector('p');
            if (paragraph) {
                // オリジンを追加してURLを更新
                paragraph.textContent = window.location.origin + profileUrl;
            }
        }
    });
});