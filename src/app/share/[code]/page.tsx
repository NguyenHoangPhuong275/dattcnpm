import { Metadata } from 'next';
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
  startTime?: string | null;
  endTime?: string | null;
  cost?: number | null;
  currency?: string | null;
}

async function getSharedTrip(code: string): Promise<{ trip: PublicTrip; items: PublicItineraryItem[] } | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/share/${code}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.success) return null;
    return { trip: data.trip, items: data.items };
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
      description: `Chuyến đi đến ${trip.destination} từ ${trip.startDate} đến ${trip.endDate}.`,
    },
  };
}

export default async function SharedTripPage({ params }: SharePageProps) {
  const { code } = await params;
  const data = await getSharedTrip(code);

  if (!data) {
    notFound();
  }

  const { trip, items } = data;

  const groupedByDay = items.reduce<Record<number, PublicItineraryItem[]>>((acc, item) => {
    if (!acc[item.day]) acc[item.day] = [];
    acc[item.day].push(item);
    return acc;
  }, {});

  const days = Object.keys(groupedByDay).map(Number).sort((a, b) => a - b);

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
              <span className="font-semibold">Bắt đầu:</span> {trip.startDate}
            </div>
            <div>
              <span className="font-semibold">Kết thúc:</span> {trip.endDate}
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
                          {item.note || `Hoạt động ${idx + 1}`}
                        </div>
                        {(item.startTime || item.endTime) && (
                          <div className="mt-1 text-xs text-slate-500">
                            {item.startTime ? new Date(item.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''} 
                            {item.endTime ? ` - ${new Date(item.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}` : ''}
                          </div>
                        )}
                        {item.cost != null && (
                          <div className="mt-1 text-xs font-medium text-emerald-600">
                            Chi phí: {item.cost} {item.currency || 'VND'}
                          </div>
                        )}
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Lịch trình được chia sẻ công khai. Dữ liệu chỉ để xem.
        </p>
      </div>
    </div>
  );
}
