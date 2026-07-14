import Link from 'next/link';
import Image from 'next/image';
import { ROUTES } from '@/lib/constants';

interface BrandLogoProps {
  className?: string;
  id?: string;
}

export default function BrandLogo({ className = '', id = 'brand-logo-link' }: BrandLogoProps): React.JSX.Element {
  return (
    <Link
      id={id}
      href={ROUTES.home}
      className={`flex items-center group cursor-pointer ${className}`}
      aria-label="LOTUS TRAVEL"
    >
      <Image
        src="/images/logo.svg"
        alt="LOTUS TRAVEL"
        width={48}
        height={48}
        className="w-12 h-12 transition-transform group-hover:scale-105"
      />
    </Link>
  );
}
