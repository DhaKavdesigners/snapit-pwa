'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { RiderInstructionViewer } from '@/components/common/RiderInstructionViewer';

export default function InstructionsPage() {
  const router = useRouter();

  const handleClose = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/profile');
    }
  };

  return (
    <AppShell
      showNav={false}
      showBack={true}
      onBack={handleClose}
      title="Rider Instructions"
      noPadding={true}
      fullHeight={true}
    >
      <div className="flex-1 min-h-0 w-full h-full flex flex-col justify-between overflow-hidden">
        <RiderInstructionViewer
          isModal={false}
          onDone={handleClose}
          onClose={handleClose}
        />
      </div>
    </AppShell>
  );
}
