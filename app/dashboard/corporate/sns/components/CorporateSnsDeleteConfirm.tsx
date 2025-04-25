// app/dashboard/corporate/sns/components/CorporateSnsDeleteConfirm.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { toast } from 'react-hot-toast';
import { handleApiError } from '../utils';

interface CorporateSnsDeleteConfirmProps {
  linkId: string;
  onCancel: () => void;
  onSuccess: (deletedId: string) => void;
  isRequired?: boolean;
}

export function CorporateSnsDeleteConfirm({
  linkId,
  onCancel,
  onSuccess,
  isRequired = false,
}: CorporateSnsDeleteConfirmProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!linkId) {
      toast.error('削除するリンクが指定されていません');
      return;
    }

    try {
      setIsDeleting(true);

      // API呼び出し
      const response = await fetch(`/api/corporate/sns/${linkId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '法人共通SNSリンクの削除に失敗しました');
      }

      toast.success('法人共通SNSリンクを削除しました');
      onSuccess(linkId);
    } catch (error) {
      console.error('SNSリンク削除エラー:', error);
      toast.error(handleApiError(error, '法人共通SNSリンクの削除に失敗しました'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-md bg-white">
      <DialogHeader>
        <DialogTitle className="text-red-600">法人共通SNSリンクを削除</DialogTitle>
      </DialogHeader>

      <div className="mt-4 text-gray-700 text-justify">
        <p>
          この法人共通SNSリンクを削除してもよろしいですか？ この操作は元に戻すことができません。
        </p>
        {isRequired && (
          <p className="mt-2 text-amber-600 font-medium">
            このSNSは「必須」に設定されています。削除すると、ユーザーに追加済みのリンクには影響しませんが、
            新規ユーザーにはこのSNSが自動追加されなくなります。
          </p>
        )}
        <p className="mt-2 text-sm text-gray-500">
          ※すでにユーザーに追加されているSNSリンクは削除されません。
        </p>
      </div>

      <div className="flex justify-end space-x-4 mt-6">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isDeleting}>
          キャンセル
        </Button>
        <Button type="button" variant="destructive" onClick={handleDelete} disabled={isDeleting}>
          {isDeleting ? (
            <div className="flex items-center">
              <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin mr-2" />
              削除中...
            </div>
          ) : (
            '削除'
          )}
        </Button>
      </div>
    </DialogContent>
  );
}