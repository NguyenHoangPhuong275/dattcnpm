import Link from 'next/link';
import BrandLogo from '@/components/BrandLogo';
import { ROUTES } from '@/lib/constants';

const EXPLORE_LINKS = [
  { label: 'Địa phương', href: ROUTES.local },
  { label: 'Điểm đến', href: `${ROUTES.home}#planner` },
  { label: 'Khách sạn', href: ROUTES.hotels },
  { label: 'Tin tức du lịch', href: ROUTES.travelReferences },
] as const;

const ACCOUNT_LINKS = [
  { label: 'Hồ sơ cá nhân', href: ROUTES.profile },
  { label: 'Chuyến đi của tôi', href: ROUTES.trips },
] as const;

interface FooterColumnProps {
  title: string;
  links: readonly { label: string; href: string }[];
}

function FooterColumn({ title, links }: FooterColumnProps): React.JSX.Element {
  return (
    <div>
      <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">{title}</h3>
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-primary-darker)]"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function AppFooter(): React.JSX.Element {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)] print:hidden">
      <div className="mx-auto w-full max-w-[1500px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <BrandLogo />
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-[var(--color-text-muted)]">
              LOTUS TRAVEL — hệ thống tổng hợp địa điểm, thời tiết và lập lịch trình du lịch thông minh, giúp bạn tối ưu hóa mọi hành trình khám phá Việt Nam.
            </p>
          </div>

          <FooterColumn title="Khám phá" links={EXPLORE_LINKS} />
          <FooterColumn title="Tài khoản" links={ACCOUNT_LINKS} />
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-[var(--color-border)] pt-6 sm:flex-row">
          <p className="text-xs font-medium text-[var(--color-text-muted)]">
            © {year} LOTUS TRAVEL. Đồ án Thực tế Công nghệ Phần mềm.
          </p>
          <p className="text-xs font-medium text-[var(--color-text-muted)]">
            Dữ liệu địa điểm từ OpenStreetMap · Thời tiết từ Open-Meteo
          </p>
        </div>
      </div>
    </footer>
  );
}
