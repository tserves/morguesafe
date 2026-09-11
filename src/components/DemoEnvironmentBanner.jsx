import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { FlaskConical, X } from 'lucide-react';

export default function DemoEnvironmentBanner() {
  const [hasDemo, setHasDemo] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        const decedents = await base44.entities.Decedent.filter({ is_demo_data: true }, undefined, 1);
        if (decedents.length > 0) setHasDemo(true);
      } catch (e) {}
    };
    check();
  }, []);

  if (!hasDemo || dismissed) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-1.5 flex items-center gap-2">
      <FlaskConical className="w-3.5 h-3.5 text-amber-600 shrink-0" />
      <span className="text-xs text-amber-800 font-medium">Demo Environment — Synthetic data is currently loaded</span>
      <button onClick={() => setDismissed(true)} className="ml-auto p-0.5 rounded hover:bg-amber-100 transition-colors">
        <X className="w-3 h-3 text-amber-600" />
      </button>
    </div>
  );
}