// components/forms/ProfileForm.tsx
'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ProfileSchema } from '@/schemas/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import type { User, Profile } from '@prisma/client';
import { updateProfile } from '@/actions/profile';
import { ProfileUpdateData } from '@/types/user';
import { z } from 'zod';
// 拡張されたProfileSchemaを定義
const ExtendedProfileSchema = ProfileSchema.extend({
  // 姓名とフリガナを分離
  lastName: z.string().optional().nullable(),
  firstName: z.string().optional().nullable(),
  lastNameKana: z.string().optional().nullable(),
  firstNameKana: z.string().optional().nullable(),
  // 互換性のために元のフィールドも残す
  name: z.string().optional().nullable(),
  nameEn: z.string().optional().nullable(),
  nameKana: z.string().optional().nullable(),
  // 他のフィールド
  companyUrl: z
    .string()
    .transform((val) => (val === '' ? null : val))
    .refine((val) => val === null || /^https?:\/\//i.test(val), {
      message: '有効なURLを入力してください',
    })
    .optional()
    .nullable(),
  companyLabel: z.string().optional().nullable(),
});
type FormData = z.infer<typeof ExtendedProfileSchema>;
interface ProfileFormProps {
  user: User & { profile?: Profile | null };
}
export function ProfileForm({ user }: ProfileFormProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [image, setImage] = useState<string | null>(user.image || null);
  // 名前とフリガナを分割して初期値を設定
  const splitName = () => {
    if (user.lastName && user.firstName) {
      // 既に分割されている場合はそれを使用
      return {
        lastName: user.lastName,
        firstName: user.firstName,
      };
    } else if (user.name) {
      // 結合されている場合は分割する
      const parts = user.name.split(' ');
      if (parts.length > 1) {
        return {
          lastName: parts[0],
          firstName: parts.slice(1).join(' '),
        };
      }
      return {
        lastName: user.name,
        firstName: '',
      };
    }
    return { lastName: '', firstName: '' };
  };
  // フリガナも同様に分割
  const splitNameKana = () => {
    if (user.lastNameKana && user.firstNameKana) {
      return {
        lastNameKana: user.lastNameKana,
        firstNameKana: user.firstNameKana,
      };
    } else if (user.nameKana) {
      const parts = user.nameKana.split(' ');
      if (parts.length > 1) {
        return {
          lastNameKana: parts[0],
          firstNameKana: parts.slice(1).join(' '),
        };
      }
      return {
        lastNameKana: user.nameKana,
        firstNameKana: '',
      };
    }
    return { lastNameKana: '', firstNameKana: '' };
  };
  const { lastName, firstName } = splitName();
  const { lastNameKana, firstNameKana } = splitNameKana();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(ExtendedProfileSchema),
    defaultValues: {
      lastName: lastName,
      firstName: firstName,
      lastNameKana: lastNameKana,
      firstNameKana: firstNameKana,
      nameEn: user.nameEn || '',
      bio: user.bio || '',
      phone: user.phone || '',
      company: user.company || '',
      companyUrl: (user as unknown as { companyUrl?: string | null }).companyUrl || '',
      companyLabel: (user as unknown as { companyLabel?: string | null }).companyLabel || '会社HP',
    },
  });
  const onSubmit = async (data: FormData) => {
    try {
      setIsPending(true);
      // 会社URLの処理
      let processedCompanyUrl = data.companyUrl?.trim() || null;
      if (processedCompanyUrl && !/^https?:\/\//i.test(processedCompanyUrl)) {
        processedCompanyUrl = `https://${processedCompanyUrl}`;
      }
      // 姓名とフリガナを結合して互換性のある形式にする
      const name =
        data.lastName && data.firstName
          ? `${data.lastName} ${data.firstName}`
          : data.lastName || data.firstName || undefined;
      const nameKana =
        data.lastNameKana && data.firstNameKana
          ? `${data.lastNameKana} ${data.firstNameKana}`
          : data.lastNameKana || data.firstNameKana || undefined;
      // 画像が変更されていたら、imageも送信
      const profileData: ProfileUpdateData = {
        // 分割されたフィールド
        lastName: data.lastName,
        firstName: data.firstName,
        lastNameKana: data.lastNameKana,
        firstNameKana: data.firstNameKana,
        // 互換性のある形式
        name,
        nameKana,
        nameEn: data.nameEn,
        bio: data.bio,
        companyUrl: processedCompanyUrl,
        phone: data.phone,
        company: data.company,
        companyLabel: data.companyLabel,
        image: image !== user.image ? image : undefined,
      };
      const response = await updateProfile(profileData); // 適切な型でanyを使用しない
      if (response.error) {
        throw new Error(response.error);
      }
      toast.success('プロフィールを更新しました');
      router.refresh();
    } catch {
      toast.error('プロフィールの更新に失敗しました');
    } finally {
      setIsPending(false);
    }
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div className="flex flex-col items-center space-y-4">
          <ImageUpload
            value={image}
            onChange={(value: string | null) => setImage(value)}
            disabled={isPending}
          />
          <p className="text-sm text-muted-foreground text-justify">
            クリックして画像をアップロード（JPG, PNG, 最大1MB）
          </p>
        </div>
        {/* 姓名を分割したフィールド */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Input
              label="姓"
              placeholder="山田"
              {...register('lastName')}
              error={errors.lastName?.message}
              disabled={isPending}
            />
          </div>
          <div>
            <Input
              label="名"
              placeholder="太郎"
              {...register('firstName')}
              error={errors.firstName?.message}
              disabled={isPending}
            />
          </div>
        </div>
        <div>
          <Input
            label="名前（英語/ローマ字）"
            placeholder="Taro Yamada"
            {...register('nameEn')}
            error={errors.nameEn?.message}
            disabled={isPending}
          />
        </div>
        {/* フリガナ入力欄も姓名分離 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Input
              label="姓（フリガナ）"
              placeholder="ヤマダ"
              {...register('lastNameKana')}
              error={errors.lastNameKana?.message}
              disabled={isPending}
            />
          </div>
          <div>
            <Input
              label="名（フリガナ）"
              placeholder="タロウ"
              {...register('firstNameKana')}
              error={errors.firstNameKana?.message}
              disabled={isPending}
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          スマートフォンの連絡先に登録する際のフリガナです。
        </p>
        {/* 残りのフィールドは変更なし */}
        <div>
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            自己紹介
          </label>
          <textarea
            className="mt-2 flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="自己紹介（最大300文字）"
            {...register('bio')}
            disabled={isPending}
          />
          {errors.bio?.message && (
            <p className="text-sm text-destructive mt-1">{errors.bio.message}</p>
          )}
        </div>
        <div>
          <Input
            label="電話番号"
            placeholder="090XXXXXXXX"
            {...register('phone')}
            error={errors.phone?.message}
            disabled={isPending}
          />
        </div>
        <div>
          <Input
            label="会社/組織名"
            placeholder="株式会社〇〇"
            {...register('company')}
            error={errors.company?.message}
            disabled={isPending}
          />
        </div>
        <div>
          <Input
            label="会社/組織のWebサイトURL"
            placeholder="https://example.com"
            {...register('companyUrl')}
            error={errors.companyUrl?.message}
            disabled={isPending}
          />
        </div>
        <div>
          <Input
            label="会社/組織のリンク表示名"
            placeholder="会社HP"
            {...register('companyLabel')}
            error={errors.companyLabel?.message}
            disabled={isPending}
          />
          <p className="text-xs text-muted-foreground mt-1">
            プロフィールページで表示されるボタンの名前です（デフォルト: 会社HP）
          </p>
        </div>
      </div>
      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? '更新中...' : 'プロフィールを更新'}
      </Button>
    </form>
  );
}