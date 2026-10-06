'use client';

import React from 'react';
import { useRider } from '@/context/RiderContext';
import { RiderGuidedTour } from './RiderGuidedTour';

export const GlobalTourContainer: React.FC = () => {
  const { isTourOpen, closeTour, completeTour, rider } = useRider();
  const isApproved =
    rider.isVerified === true ||
    String(rider.verificationStatus || '').toUpperCase() === 'APPROVED';

  return (
    <>
      {isTourOpen && !isApproved && (
        <RiderGuidedTour
          isOpen={isTourOpen}
          onClose={closeTour}
          onComplete={completeTour}
        />
      )}
    </>
  );
};
