'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useApp } from '../context/AppContext';

function ModalSyncInner() {
  const searchParams = useSearchParams();
  const { setIsCartOpen, setIsCheckoutOpen } = useApp();

  useEffect(() => {
    const open = searchParams.get('open');
    if (open === 'cart') {
      setIsCartOpen(true);
    } else if (open === 'checkout') {
      setIsCheckoutOpen(true);
    }
  }, [searchParams, setIsCartOpen, setIsCheckoutOpen]);

  return null;
}

export function ModalUrlSync() {
  return (
    <Suspense fallback={null}>
      <ModalSyncInner />
    </Suspense>
  );
}
