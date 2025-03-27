// scripts/setup-guide-images.js
// SNSガイド用の画像ディレクトリを設定するスクリプト

import fs from 'fs/promises';
import path from 'path';

// SNSプラットフォーム
const PLATFORMS = [
    'line',
    'youtube',
    'x',
    'instagram',
    'tiktok',
    'facebook',
    'pinterest',
    'pixiv',
    'threads',
    'skype',
    'note',
    'whatsapp'
];

async function main() {
    try {
        // 公開ディレクトリのパス
        const publicDir = path.join(process.cwd(), 'public');

        // ガイド画像用のディレクトリパス
        const guidesDir = path.join(publicDir, 'images', 'guides');

        // ディレクトリが存在しない場合は作成
        try {
            await fs.mkdir(path.join(publicDir, 'images'), { recursive: true });
            await fs.mkdir(guidesDir, { recursive: true });
            console.log('✅ ガイド画像用のディレクトリを作成しました:', guidesDir);
        } catch (error) {
            if (error.code !== 'EEXIST') {
                throw error;
            }
            console.log('ℹ️ ガイド画像用のディレクトリは既に存在します:', guidesDir);
        }

        // 各プラットフォーム用のプレースホルダー画像を作成
        for (const platform of PLATFORMS) {
            // 各プラットフォームごとに3つのステップ画像を作成
            for (let step = 1; step <= 3; step++) {
                const imagePath = path.join(guidesDir, `${platform}-step${step}.png`);

                // ファイルの存在確認を try-catch ではなく fs.stat を使用して行う
                const fileExists = await fs.stat(imagePath).then(() => true).catch(() => false);

                if (fileExists) {
                    console.log(`ℹ️ 画像は既に存在します: ${imagePath}`);
                } else {
                    // ファイルが存在しない場合、空のテキストファイルを作成
                    const placeholderContent = `このファイルは ${platform} のステップ ${step} 用のプレースホルダーです。\n実際の画像に置き換えてください。`;
                    await fs.writeFile(`${imagePath}.txt`, placeholderContent);
                    console.log(`✅ プレースホルダーを作成しました: ${imagePath}.txt`);
                }
            }
        }

        console.log('\n✨ セットアップが完了しました！');
        console.log('以下のディレクトリに各SNSプラットフォームのガイド画像を配置してください:');
        console.log(guidesDir);
        console.log('\nファイル命名規則: [プラットフォーム]-step[ステップ番号].png');
        console.log('例: line-step1.png, youtube-step2.png, instagram-step3.png\n');

    } catch (error) {
        console.error('❌ エラーが発生しました:', error);
        process.exit(1);
    }
}

// スクリプトを実行
main();