'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { apiRequest, ensureApiSuccess, getApiErrorMessage, type ApiEnvelope } from '@/lib/api-client';
import type { BookingListPage, BookingListPagination } from '@/types/booking';

const BOOKING_PAGE_SIZE = 20;
const bookingPageRequests = new Map<string, Promise<unknown>>();

type BookingListStatus = 'loading' | 'success' | 'error';

interface BookingListItem {
  id: string;
}

interface UsePaginatedBookingListOptions {
  endpoint: string;
  fallbackMessage: string;
  userId: string;
}

interface UsePaginatedBookingListResult<T extends BookingListItem> {
  data: T[];
  status: BookingListStatus;
  error: string;
  loadingMore: boolean;
  hasMore: boolean;
  actions: {
    loadFirstPage: () => Promise<void>;
    loadMore: () => Promise<void>;
    refreshLoadedPages: () => Promise<void>;
  };
}

const INITIAL_PAGINATION: BookingListPagination = {
  page: 1,
  limit: BOOKING_PAGE_SIZE,
  total: 0,
  totalPages: 0,
};

function mergeUnique<T extends BookingListItem>(current: T[], incoming: T[]): T[] {
  const items = new Map(current.map((item) => [item.id, item]));
  incoming.forEach((item) => items.set(item.id, item));
  return [...items.values()];
}

function isBookingListPage<T extends BookingListItem>(value: unknown): value is BookingListPage<T> {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<BookingListPage<T>>;
  const pagination = candidate.pagination;
  return Array.isArray(candidate.items)
    && !!pagination
    && Number.isFinite(pagination.page)
    && Number.isFinite(pagination.limit)
    && Number.isFinite(pagination.total)
    && Number.isFinite(pagination.totalPages);
}

function dedupeBookingPageRequest<T>(key: string, requestFactory: () => Promise<T>): Promise<T> {
  const currentRequest = bookingPageRequests.get(key);
  if (currentRequest) return currentRequest as Promise<T>;

  const request = requestFactory().finally(() => {
    if (bookingPageRequests.get(key) === request) {
      bookingPageRequests.delete(key);
    }
  });
  bookingPageRequests.set(key, request);
  return request;
}

export function usePaginatedBookingList<T extends BookingListItem>({
  endpoint,
  fallbackMessage,
  userId,
}: UsePaginatedBookingListOptions): UsePaginatedBookingListResult<T> {
  const [items, setItems] = useState<T[]>([]);
  const [pagination, setPagination] = useState<BookingListPagination>(INITIAL_PAGINATION);
  const [status, setStatus] = useState<BookingListStatus>('loading');
  const [error, setError] = useState('');
  const [loadingMore, setLoadingMore] = useState(false);
  const [stateUserId, setStateUserId] = useState(userId);
  const requestVersion = useRef(0);
  const activeUserIdRef = useRef(userId);
  const hasCurrentUserState = stateUserId === userId;

  useEffect(() => {
    activeUserIdRef.current = userId;
    requestVersion.current += 1;
  }, [userId]);

  const fetchPage = useCallback(async (page: number): Promise<BookingListPage<T>> => {
    const searchParams = new URLSearchParams({
      page: String(page),
      limit: String(BOOKING_PAGE_SIZE),
    });
    const requestUrl = `${endpoint}?${searchParams}`;
    const requestKey = `${userId}:${requestUrl}`;
    return dedupeBookingPageRequest(requestKey, async () => {
      const { response, data } = await apiRequest<ApiEnvelope<BookingListPage<T>>>(requestUrl, { userId });
      ensureApiSuccess(response, data, fallbackMessage);
      if (!isBookingListPage<T>(data.data)) throw new Error(fallbackMessage);
      return data.data;
    });
  }, [endpoint, fallbackMessage, userId]);

  const loadFirstPage = useCallback(async (): Promise<void> => {
    if (activeUserIdRef.current !== userId) return;
    const version = ++requestVersion.current;
    setStateUserId(userId);
    setItems([]);
    setPagination(INITIAL_PAGINATION);
    setLoadingMore(false);
    setStatus('loading');
    setError('');
    try {
      const result = await fetchPage(1);
      if (requestVersion.current !== version || activeUserIdRef.current !== userId) return;
      setItems(result.items);
      setPagination(result.pagination);
      setStatus('success');
    } catch (requestError: unknown) {
      if (requestVersion.current !== version || activeUserIdRef.current !== userId) return;
      setError(getApiErrorMessage(requestError, fallbackMessage));
      setStatus('error');
    }
  }, [fallbackMessage, fetchPage, userId]);

  const loadMore = useCallback(async (): Promise<void> => {
    if (activeUserIdRef.current !== userId) return;
    if (loadingMore || status !== 'success' || pagination.page >= pagination.totalPages) return;
    const version = ++requestVersion.current;
    setLoadingMore(true);
    setError('');
    try {
      const result = await fetchPage(pagination.page + 1);
      if (requestVersion.current !== version || activeUserIdRef.current !== userId) return;
      setItems((current) => mergeUnique(current, result.items));
      setPagination(result.pagination);
    } catch (requestError: unknown) {
      if (requestVersion.current !== version || activeUserIdRef.current !== userId) return;
      setError(getApiErrorMessage(requestError, fallbackMessage));
    } finally {
      if (requestVersion.current === version && activeUserIdRef.current === userId) setLoadingMore(false);
    }
  }, [fallbackMessage, fetchPage, loadingMore, pagination.page, pagination.totalPages, status, userId]);

  const refreshLoadedPages = useCallback(async (): Promise<void> => {
    if (activeUserIdRef.current !== userId) return;
    const version = ++requestVersion.current;
    const loadedPageCount = Math.max(1, pagination.page);
    setLoadingMore(false);
    setError('');
    try {
      const pages = await Promise.all(
        Array.from({ length: loadedPageCount }, (_, index) => fetchPage(index + 1)),
      );
      if (requestVersion.current !== version || activeUserIdRef.current !== userId) return;
      const firstPage = pages[0];
      if (!firstPage) return;
      const refreshedItems = pages.flatMap((page) => page.items);
      const visiblePage = firstPage.pagination.totalPages === 0
        ? 1
        : Math.min(loadedPageCount, firstPage.pagination.totalPages);
      setItems(mergeUnique([], refreshedItems));
      setPagination({ ...firstPage.pagination, page: visiblePage });
      setStatus('success');
    } catch (requestError: unknown) {
      if (requestVersion.current !== version || activeUserIdRef.current !== userId) return;
      setError(getApiErrorMessage(requestError, fallbackMessage));
    }
  }, [fallbackMessage, fetchPage, pagination.page, userId]);

  return {
    data: hasCurrentUserState ? items : [],
    status: hasCurrentUserState ? status : 'loading',
    error: hasCurrentUserState ? error : '',
    loadingMore: hasCurrentUserState && loadingMore,
    hasMore: hasCurrentUserState && status === 'success' && pagination.page < pagination.totalPages,
    actions: {
      loadFirstPage,
      loadMore,
      refreshLoadedPages,
    },
  };
}
