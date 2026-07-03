'use client';

import { FeatureGate } from '@/views/subscription/FeatureGate';
import { ShiftCheckInView } from '@/views/shift/ShiftCheckInView';

export default function CheckInPage() {
  return (
    <FeatureGate>
      <ShiftCheckInView />
    </FeatureGate>
  );
}
