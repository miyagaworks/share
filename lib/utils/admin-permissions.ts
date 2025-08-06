// lib/utils/admin-permissions.ts - 権限チェックユーティリティ
import React from 'react';

export interface PagePermissions {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canCreate: boolean;
  readOnlyMessage?: string;
}

export function getPagePermissions(
  userType: 'admin' | 'financial-admin',
  page: string,
): PagePermissions {
  const permissions: PagePermissions = {
    canView: false,
    canEdit: false,
    canDelete: false,
    canCreate: false,
  };

  // スーパー管理者は全権限
  if (userType === 'admin') {
    permissions.canView = true;
    permissions.canEdit = true;
    permissions.canDelete = true;
    permissions.canCreate = true;
    return permissions;
  }

  // 財務管理者の権限設定
  if (userType === 'financial-admin') {
    permissions.canView = true; // 基本的に閲覧は可能

    switch (page) {
      // 財務関連 - 編集権限あり
      case 'financial-dashboard':
      case 'company-expenses':
      case 'stripe-revenue':
        permissions.canEdit = true;
        permissions.canCreate = true;
        permissions.canDelete = true;
        break;

      // 受託者支払い管理 - 閲覧のみ
      case 'contractor-payments':
        permissions.readOnlyMessage =
          '受託者支払い管理は閲覧のみ可能です。操作にはスーパー管理者権限が必要です。';
        break;

      // 財務管理者管理 - 閲覧のみ
      case 'financial-admins':
        permissions.readOnlyMessage =
          '財務管理者管理は閲覧のみ可能です。追加・削除・権限変更にはスーパー管理者権限が必要です。';
        break;

      // システム管理全般 - 閲覧のみ
      case 'users':
      case 'subscriptions':
      case 'cancel-requests':
      case 'data-export':
      case 'profiles':
      case 'permissions':
      case 'notifications':
      case 'email':
        permissions.readOnlyMessage =
          'システム管理機能は閲覧のみ可能です。データの編集・削除・操作にはスーパー管理者権限が必要です。';
        break;

      default:
        permissions.canView = false;
        break;
    }
  }

  return permissions;
}

// 権限チェック用のReactコンポーネント
export function ReadOnlyBanner({
  message,
  showIcon = true,
}: {
  message?: string;
  showIcon?: boolean;
}) {
  if (!message) return null;

  return React.createElement(
    'div',
    { className: 'bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6' },
    React.createElement(
      'div',
      { className: 'flex items-start' },
      showIcon &&
        React.createElement(
          'svg',
          {
            className: 'h-5 w-5 text-amber-500 mt-0.5 mr-3',
            fill: 'none',
            viewBox: '0 0 24 24',
            stroke: 'currentColor',
          },
          React.createElement('path', {
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            strokeWidth: 2,
            d: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
          }),
        ),
      React.createElement(
        'div',
        null,
        React.createElement(
          'h3',
          { className: 'font-semibold text-amber-800 mb-1' },
          '閲覧のみモード',
        ),
        React.createElement('p', { className: 'text-amber-700 text-sm' }, message),
      ),
    ),
  );
}