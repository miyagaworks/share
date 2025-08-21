// components/subscription/SubscriptionSettingsWithSeal.tsx
'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import SubscriptionSettings from './SubscriptionSettings';
import { OneTapSealSection } from '../one-tap-seal/OneTapSealSection';
import { FEATURE_FLAGS, getSealFeatureName } from '@/lib/feature-config';

export default function SubscriptionSettingsWithSeal() {
  const { data: session } = useSession();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!session?.user?.id) return;

      try {
        const response = await fetch('/api/profile');
        if (response.ok) {
          const data = await response.json();
          setUserProfile(data.user);
        }
      } catch (error) {
        console.error('プロフィール取得エラー:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [session]);

  if (isLoading) {
    return <div>読み込み中...</div>;
  }

  return (
    <div className="space-y-6">
      <SubscriptionSettings />

      <div>
        <OneTapSealSection />
      </div>
    </div>
  );
}