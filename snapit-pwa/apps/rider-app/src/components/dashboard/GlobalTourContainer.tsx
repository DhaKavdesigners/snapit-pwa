'use client';

import React from 'react';
import { useRider } from '@/context/RiderContext';
import { RiderGuidedTour } from './RiderGuidedTour';
import { RiderDemoController } from './RiderDemoController';

export const GlobalTourContainer: React.FC = () => {
  const { isTourOpen, closeTour, completeTour, isDemoMode } = useRider();

  return (
    <>
      {isTourOpen && (
        <RiderGuidedTour
          isOpen={isTourOpen}
          onClose={closeTour}
          onComplete={completeTour}
        />
      )}
      {isDemoMode && <RiderDemoController />}
    </>
  );
};
