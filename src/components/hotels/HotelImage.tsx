'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  getHotelGradient,
  getHotelInitial,
  isDisplayableImage,
  isOptimizableImage,
} from '@/lib/hotel-utils';

interface HotelImageProps {
  src: string | null;
  seed: string;
  name: string;
  sizes: string;
  className?: string;
  priority?: boolean;
}

export default function HotelImage({ src, seed, name, sizes, className, priority }: HotelImageProps): React.JSX.Element {
  const [failed, setFailed] = useState(false);

  if (!src || failed || !isDisplayableImage(src)) {
    return (
      <div
        className="flex h-full w-full items-center justify-center text-3xl font-extrabold text-white"
        style={{ backgroundImage: getHotelGradient(seed) }}
      >
        {getHotelInitial(name)}
      </div>
    );
  }

  if (!isOptimizableImage(src)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        sizes={sizes}
        loading={priority ? 'eager' : 'lazy'}
        className={`absolute inset-0 h-full w-full ${className ?? ''}`}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={name}
      fill
      sizes={sizes}
      priority={priority}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
