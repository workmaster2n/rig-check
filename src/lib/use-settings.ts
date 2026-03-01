'use client';

import { useMemo } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import { useDoc } from '@/firebase/firestore/use-doc.tsx';
import { DEFAULT_SETTINGS, RigSettings } from '@/lib/store';

export function useSettings() {
  const firestore = useFirestore();
  const { user } = useUser();

  const settingsRef = useMemo(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid, 'settings', 'rig');
  }, [firestore, user]);

  const { data, isLoading } = useDoc<RigSettings>(settingsRef);
  const settings: RigSettings = data ?? DEFAULT_SETTINGS;

  const updateSettings = async (updated: RigSettings) => {
    if (!settingsRef) return;
    await setDoc(settingsRef, updated, { merge: true });
  };

  return { settings, updateSettings, isLoading };
}
