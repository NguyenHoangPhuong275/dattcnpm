import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
interface SharePageProps {
  params: Promise<{ code: string }>;
}

interface PublicTrip {
  _id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  description?: string | null;
  coverImage?: string | null;
  isPublic?: boolean;
}

interface PublicItineraryItem {
  _id: string;
  day: number;
  orderIndex: number;
  note?: string;
  placeId: string;
  place?: {
    name: string;
    address?: string | null;
  } | null;
  startTime?: string | null;
  endTime?: string | null;
  cost?: number | null;
  currency?: string | null;
}

interface PublicAccommodation {
  _id: string;
  hotelId?: string | null;
  name: string;
  address?: string | null;
  checkIn: string;
  checkOut: string;
}

interface PublicBudgetItem {
  _id: string;
  category: string;
  amount: number;
  currency: string;
  note?: string | null;
  type: 'planned' | 'actual';
}

interface PublicBudget {
  items: PublicBudgetItem[];
  totalPlanned: number;
  totalActual: number;
}

interface SharedTripData {
  trip: PublicTrip;
  items: PublicItineraryItem[];
  accommodations: PublicAccommodation[];
  budget: PublicBudget;
}

const BUDGET_CATEGORY_LABELS: Record<string, string> = {
  transport: 'Di chuyển',
  food: 'Ăn uống',
  accommodation: 'Lưu trú',
  ticket: 'Vé',
  shopping: 'Mua sắm',
  other: 'Khác',
};

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatAmount(value: number, currency: string): string {
  return `${value.toLocaleString('vi-VN')} ${currency || 'VND'}`;
}

async function getSharedTrip(code: string): Promise<SharedTripData | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/share/${code}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const body = await res.json();
    if (!body.success || !body.data?.trip) return null;
    return {
      trip: body.data.trip,
      items: body.data.items ?? [],
      accommodations: body.data.accommodations ?? [],
      budget: body.data.budget ?? { items: [], totalPlanned: 0, totalActual: 0 },
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
  const { code } = await params;
  const data = await getSharedTrip(code);
  if (!data) {
    return { title: 'Lịch trình không tồn tại' };
  }
  const { trip } = data;
  return {
    title: `${trip.title} | Lịch trình chia sẻ`,
    description: `Lịch trình ${trip.title} đến ${trip.destination}. Xem chi tiết lịch trình được chia sẻ công khai.`,
    openGraph: {
      title: `${trip.title} - Lịch trình du lịch`,
      description: `Chuyến đi đến ${trip.destination} từ ${formatDate(trip.startDate)} đến ${formatDate(trip.endDate)}.`,
    },
  };
}

export default async function SharedTripPage({ params }: SharePageProps) {
  const { code } = await params;
  const data = await getSharedTrip(code);

  if (!data) {
    notFound();
  }

  const { trip, items, accommodations, budget } = data;

  const groupedByDay = items.reduce<Record<number, PublicItineraryItem[]>>((acc, item) => {
    if (!acc[item.day]) acc[item.day] = [];
    acc[item.day].push(item);
    return acc;
  }, {});

  const days = Object.keys(groupedByDay).map(Number).sort((a, b) => a - b);
  const budgetCurrency = budget.items[0]?.currency || 'VND';

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="mx-auto max-w-4xl px-4">
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center text-sm font-semibold text-amber-700">
          Đây là lịch trình được chia sẻ • Chỉ xem
        </div>

        <div className="rounded-2xl bg-white p-8 shadow">
          <h1 className="text-3xl font-extrabold text-slate-900">{trip.title}</h1>
          <p className="mt-1 text-lg font-medium text-slate-600">{trip.destination}</p>

          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <div>
              <span className="font-semibold">Bắt đầu:</span> {formatDate(trip.startDate)}
            </div>
            <div>
              <span className="font-semibold">Kết thúc:</span> {formatDate(trip.endDate)}
            </div>
            {trip.description && <div className="w-full text-slate-600">{trip.description}</div>}
          </div>

          <div className="mt-8">
            <h2 className="mb-4 text-xl font-bold text-slate-800">Lịch trình chi tiết</h2>

            {days.length === 0 && (
              <div className="rounded-lg border border-dashed border-slate-300 px-4 py-12 text-center">
                <p className="text-sm font-semibold text-slate-700">Chưa có lịch trình</p>
                <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
                  Hành trình này chưa có hoạt động nào được thêm vào.
                </p>
              </div>
            )}

            {days.map((day) => (
              <div key={day} className="mb-6 border-l-4 border-[color:var(--color-primary-darker)] pl-4">
                <div className="mb-2 font-bold text-slate-700">Ngày {day}</div>
                <ul className="space-y-3">
                  {groupedByDay[day]
                    .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))
                    .map((item, idx) => (
                      <li key={item._id} className="rounded-xl border bg-white p-3 text-sm">
                        <div className="font-semibold text-slate-800">
                          {item.place?.name || item.note || `Hoạt động ${idx + 1}`}
                        </div>
                        {item.place?.address && (
                          <div className="mt-1 text-xs text-slate-500">{item.place.address}</div>
                        )}
                        {item.note && item.place?.name && item.note !== item.place.name && (
                          <div className="mt-1 text-xs text-slate-600">{item.note}</div>
                        )}
                        {(item.startTime || item.endTime) && (
                          <div className="mt-1 text-xs text-slate-500">
                            {item.startTime ? new Date(item.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
                            {item.endTime ? ` - ${new Date(item.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}` : ''}
                          </div>
                        )}
                        {item.cost != null && (
                          <div className="mt-1 text-xs font-medium text-emerald-600">
                            Chi phí: {formatAmount(item.cost, item.currency || 'VND')}
                          </div>
                        )}
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>

          {accommodations.length > 0 && (
            <div className="mt-8">
              <h2 className="mb-4 text-xl font-bold text-slate-800">Khách sạn</h2>
              <ul className="space-y-3">
                {accommodations.map((item) => {
                  const content = (
                    <>
                      <div className="flex items-start justify-between gap-3">
                        <div className="font-semibold text-slate-800">{item.name}</div>
                        {item.hotelId && (
                          <span className="shrink-0 text-xs font-semibold text-[color:var(--color-primary-darker)]">
                            Xem chi tiết
                          </span>
                        )}
                      </div>
                      {item.address && <div className="mt-1 text-xs text-slate-500">{item.address}</div>}
                      <div className="mt-1 text-xs text-slate-600">
                        {formatDate(item.checkIn)} đến {formatDate(item.checkOut)}
                      </div>
                    </>
                  );
                  return (
                    <li key={item._id}>
                      {item.hotelId ? (
                        <Link
                          href={`/hotels/${item.hotelId}`}
                          className="block rounded-xl border bg-white p-3 text-sm transition-colors hover:border-[color:var(--color-primary-darker)] hover:bg-slate-50"
                        >
                          {content}
                        </Link>
                      ) : (
                        <div className="rounded-xl border bg-white p-3 text-sm">{content}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {budget.items.length > 0 && (
            <div className="mt-8">
              <h2 className="mb-4 text-xl font-bold text-slate-800">Chi phí dự tính</h2>
              <ul className="space-y-2">
                {budget.items.map((item) => (
                  <li key={item._id} className="flex items-start justify-between gap-3 rounded-xl border bg-white p-3 text-sm">
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-800">
                        {BUDGET_CATEGORY_LABELS[item.category] ?? 'Khác'}
                        <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                          {item.type === 'actual' ? 'Thực chi' : 'Dự kiến'}
                        </span>
                      </div>
                      {item.note && <div className="mt-1 text-xs text-slate-500">{item.note}</div>}
                    </div>
                    <div className="shrink-0 font-semibold text-emerald-600">
                      {formatAmount(item.amount, item.currency)}
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex flex-wrap gap-4 text-sm font-semibold text-slate-700">
                <div>Tổng dự kiến: {formatAmount(budget.totalPlanned, budgetCurrency)}</div>
                <div>Tổng thực chi: {formatAmount(budget.totalActual, budgetCurrency)}</div>
              </div>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Lịch trình được chia sẻ công khai. Dữ liệu chỉ để xem.
        </p>
      </div>
    </div>
  );
}
