'use client';

import { useEffect, useRef, useState } from 'react';
import { apiRequest } from '@/lib/api-client';

interface ViewEnvelope {
  success?: boolean;
  data?: { views?: number | null };
}

export default function ReferenceViewCounter({ slug }: { slug: string }): React.JSX.Element | null {
  const [views, setViews] = useState<number | null>(null);
  const sentRef = useRef(false);

  useEffect(() => {
    if (sentRef.current) return;
    sentRef.current = true;

    apiRequest<ViewEnvelope>(`/api/travel-references/${slug}/view`, { method: 'POST' })
      .then(({ response, data }) => {
        if (response.ok && data.success && typeof data.data?.views === 'number') {
          setViews(data.data.views);
        }
      })
      .catch(() => {});
  }, [slug]);

  if (views === null) return null;

  return <span className="tabular-nums">{views.toLocaleString('vi-VN')} lượt xem</span>;
}
