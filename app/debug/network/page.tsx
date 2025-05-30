// app/debug/network/page.tsx
import { NetworkDiagnostic } from '@/components/debug/NetworkDiagnostic';

export default function NetworkDebugPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <NetworkDiagnostic />
    </div>
  );
}