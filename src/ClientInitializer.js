'use client';
import { useEffect } from 'react';
import { initDB } from '@/db';

export default function ClientInitializer() {
  useEffect(() => {
    initDB();
  }, []);

  return null;
}