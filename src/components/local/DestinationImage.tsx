'use client';

import { useState } from 'react';
import Image from 'next/image';

import { LOCALITIES } from '@/data/localities';
import { isDisplayableImage } from '@/lib/hotel-utils';
import { normalizeText } from '@/lib/trip-utils';

interface DestinationImageProps {
  src: string | null;
  name: string;
  province: string;
  sizes: string;
  className?: string;
}

function findLocalityImage(name: string, province: string): string | null {
  const haystack = normalizeText(`${name} ${province}`);
  const locality = LOCALITIES.find((item) => haystack.includes(normalizeText(item.name)));
  return locality?.image ?? null;
}

export default function DestinationImage({ src, name, province, sizes, className }: DestinationImageProps): React.JSX.Element {
  const [failed, setFailed] = useState(false);

  if (!src || failed || !isDisplayableImage(src)) {
    const localityImage = findLocalityImage(name, province);

    if (!localityImage) {
      return (
        <span className="absolute inset-0 flex items-center justify-center bg-[var(--color-primary-lightest)]">
          <Image src="/images/logo.svg" alt="" width={56} height={56} className="opacity-40" />
        </span>
      );
    }

    return <Image src={localityImage} alt={name} fill sizes={sizes} className={className} />;
  }

  return (
    <Image
      src={src}
      alt={name}
      fill
      sizes={sizes}
      unoptimized
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
