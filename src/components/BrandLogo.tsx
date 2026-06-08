import Link from 'next/link';

export default function BrandLogo({ className = '' }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`flex items-center gap-2.5 group cursor-pointer ${className}`}
    >
      <img
        src="/images/logo.svg"
        alt="LOTUS TRAVEL"
        className="w-12 h-12 transition-transform group-hover:scale-105"
      />
      <span className="font-display font-extrabold text-xl tracking-tight bg-gradient-to-r from-[#8b3a62] to-[#e07a5f] bg-clip-text text-transparent">
        LOTUS TRAVEL
      </span>
    </Link>
  );
}
