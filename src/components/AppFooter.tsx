import Link from 'next/link';
import BrandLogo from '@/components/BrandLogo';
import { ROUTES } from '@/lib/constants';

const SERVICES_LINKS = [
  { id: 'footer-service-hotels', label: 'Đặt phòng khách sạn', href: ROUTES.hotels },
  { id: 'footer-service-flights', label: 'Vé máy bay', href: ROUTES.flights },
  { id: 'footer-service-planner', label: 'Lập lịch trình', href: `${ROUTES.home}#planner` },
  { id: 'footer-service-local', label: 'Khám phá địa phương', href: ROUTES.local },
] as const;

const ACCOUNT_LINKS = [
  { id: 'footer-account-profile', label: 'Thông tin tài khoản', href: ROUTES.profile },
  { id: 'footer-account-trips', label: 'Chuyến đi của tôi', href: ROUTES.trips },
  { id: 'footer-account-references', label: 'Tin tức và cẩm nang', href: ROUTES.travelReferences },
] as const;

interface FooterColumnProps {
  title: string;
  links: readonly { id: string; label: string; href: string }[];
}

function FooterColumn({ title, links }: FooterColumnProps): React.JSX.Element {
  return (
    <div>
      <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-800">{title}</h3>
      <ul className="space-y-2.5">
        {links.map((link) => (
          <li key={link.id}>
            <Link
              id={link.id}
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
    <footer className="border-t border-[var(--color-border)] bg-slate-50 py-12 print:hidden">
      <div className="mx-auto w-full max-w-[1500px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="md:col-span-2 space-y-4">
            <BrandLogo id="footer-brand-logo-link" />
            <p className="max-w-md text-sm leading-relaxed text-[var(--color-text-muted)]">
              Khám phá điểm đến, theo dõi thời tiết và lên kế hoạch cho những hành trình đáng nhớ tại Việt Nam.
            </p>
          </div>

          <FooterColumn title="Dịch vụ" links={SERVICES_LINKS} />
          <FooterColumn title="Tài khoản" links={ACCOUNT_LINKS} />
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[var(--color-border)] pt-8 sm:flex-row">
          <p className="text-xs font-medium text-[var(--color-text-muted)]">
            © {year} LOTUS TRAVEL. Mọi quyền được bảo lưu.
          </p>
          <p className="text-xs font-medium text-[var(--color-text-muted)]">
            Nguồn dữ liệu:{' '}
            <a id="footer-openstreetmap-link" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="font-semibold hover:text-[var(--color-primary-darker)] hover:underline">
              © OpenStreetMap contributors
            </a>{' '}
            và{' '}
            <a id="footer-open-meteo-link" href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer" className="font-semibold hover:text-[var(--color-primary-darker)] hover:underline">
              Open-Meteo
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
