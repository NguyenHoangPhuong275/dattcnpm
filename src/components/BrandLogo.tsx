import Link from 'next/link';
import Image from 'next/image';

export default function BrandLogo({ className = '' }: { className?: string }) {
  return (
    <Link
      href="/"
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
