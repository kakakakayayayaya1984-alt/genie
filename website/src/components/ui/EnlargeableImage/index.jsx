'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { createPortal } from 'react-dom';

export default function EnlargeableImage({ src, alt, width, height, loading, className = '' }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // for Escape key
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // make sure we only portal on client
  useEffect(() => {
    setMounted(true);
  }, []);

  const modal = open && (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center cursor-zoom-out z-[9999]"
      onClick={() => setOpen(false)}
      onKeyDown={() => {}}
    >
      <Image
        src={src}
        alt={alt}
        width={width * 2}
        height={height * 2}
        loading={loading}
        className="max-w-[90vw] max-h-[90vh] object-contain"
      />
    </div>
  );

  return (
    <>
      {/* Inline image */}
      <div
        className={`cursor-zoom-in inline-block ${className}`}
        onClick={() => setOpen(true)}
        onKeyDown={() => {}}
      >
        <Image src={src} alt={alt} width={width} height={height} className={className} />
      </div>

      {/* Portal to body so it sits above navbar stacking context */}
      {mounted ? createPortal(modal, document.body) : null}
    </>
  );
}
