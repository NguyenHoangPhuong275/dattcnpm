'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { getApiErrorMessage } from '@/lib/api-client';

export type SearchStatus = 'idle' | 'loading' | 'success' | 'error';

export interface SearchResult {
  _id: string;
  name: string;
  type?: string;
  lat: number;
  lng: number;
  address?: string | null;
  osmId?: string | null;
}

export interface UsePlaceSearchReturn {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  searchResults: SearchResult[];
  searchStatus: SearchStatus;
  isSearching: boolean;
  selectedPlace: SearchResult | null;
  searchError: string | null;
  isDropdownOpen: boolean;
  setIsDropdownOpen: (open: boolean) => void;
  searchContainerRef: RefObject<HTMLDivElement | null>;
  handleSearch: () => void;
  searchFor: (query: string) => void;
  handleSelectPlace: (place: SearchResult) => void;
  clearSelectedPlace: () => void;
}

interface PlacesSearchPayload {
  results?: SearchResult[];
}

interface PlacesSearchResponse extends PlacesSearchPayload {
  success?: boolean;
  data?: PlacesSearchPayload;
}

const MIN_QUERY_LENGTH = 2;
const SEARCH_DEBOUNCE_MS = 350;
const EMPTY_RESULTS_MESSAGE = 'Không tìm thấy địa điểm phù hợp. Thử từ khóa khác, ví dụ: Hà Nội, Đà Lạt, Hội An.';
const CONNECTION_ERROR_MESSAGE = 'Lỗi kết nối. Vui lòng thử lại.';

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

function getResultsFromResponse(json: PlacesSearchResponse): SearchResult[] {
  const payload = json.data || json;
  return Array.isArray(payload.results) ? payload.results : [];
}

export function usePlaceSearch(): UsePlaceSearchReturn {
  const [searchQuery, setRawSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchStatus, setSearchStatus] = useState<SearchStatus>('idle');
  const [selectedPlace, setSelectedPlace] = useState<SearchResult | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const skipNextAutoSearchRef = useRef<string | null>(null);

  const abortSearch = useCallback((): void => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const setSearchQuery = useCallback((value: string): void => {
    setRawSearchQuery(value);
    setSelectedPlace((current) => {
      if (!current) return current;
      return value === current.name || value === current.address ? current : null;
    });
  }, []);

  const performSearch = useCallback(async (query: string): Promise<void> => {
    abortSearch();
    const controller = new AbortController();
    abortRef.current = controller;

    setSearchStatus('loading');
    setSearchError(null);

    try {
      const response = await fetch(`/api/places/search?q=${encodeURIComponent(query)}`, {
        signal: controller.signal,
      });
      const json = await response.json() as PlacesSearchResponse;

      if (abortRef.current !== controller) return;

      if (!response.ok || json.success === false) {
        setSearchResults([]);
        setSearchError(getApiErrorMessage(json, 'Không thể tìm kiếm'));
        setSearchStatus('error');
        setIsDropdownOpen(true);
        return;
      }

      const results = getResultsFromResponse(json);
      setSearchResults(results);
      setSearchError(results.length > 0 ? null : EMPTY_RESULTS_MESSAGE);
      setSearchStatus(results.length > 0 ? 'success' : 'error');
      setIsDropdownOpen(true);
    } catch (error: unknown) {
      if (isAbortError(error)) return;
      setSearchResults([]);
      setSearchError(CONNECTION_ERROR_MESSAGE);
      setSearchStatus('error');
      setIsDropdownOpen(true);
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
    }
  }, [abortSearch]);

  const handleSearch = useCallback((): void => {
    const query = searchQuery.trim();
    if (query.length < MIN_QUERY_LENGTH) return;
    performSearch(query);
  }, [performSearch, searchQuery]);

  const searchFor = useCallback((value: string): void => {
    const query = value.trim();
    if (query.length < MIN_QUERY_LENGTH) return;
    skipNextAutoSearchRef.current = query;
    setRawSearchQuery(query);
    setSelectedPlace(null);
    performSearch(query);
  }, [performSearch]);

  const handleSelectPlace = useCallback((place: SearchResult): void => {
    abortSearch();
    setSelectedPlace(place);
    setRawSearchQuery(place.address || place.name);
    setSearchResults([]);
    setSearchError(null);
    setSearchStatus('success');
    setIsDropdownOpen(false);
  }, [abortSearch]);

  const clearSelectedPlace = useCallback((): void => {
    abortSearch();
    setSelectedPlace(null);
    setRawSearchQuery('');
    setSearchResults([]);
    setSearchError(null);
    setSearchStatus('idle');
    setIsDropdownOpen(false);
  }, [abortSearch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      abortSearch();
    };
  }, [abortSearch]);

  useEffect(() => {
    const query = searchQuery.trim();

    if (selectedPlace && (query === selectedPlace.name || query === selectedPlace.address)) {
      return;
    }

    if (query.length < MIN_QUERY_LENGTH) {
      abortSearch();
      setSearchResults([]);
      setSearchError(null);
      setSearchStatus('idle');
      return;
    }

    if (skipNextAutoSearchRef.current === query) {
      skipNextAutoSearchRef.current = null;
      return;
    }

    const timer = setTimeout(() => {
      performSearch(query);
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [abortSearch, performSearch, searchQuery, selectedPlace]);

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    searchStatus,
    isSearching: searchStatus === 'loading',
    selectedPlace,
    searchError,
    isDropdownOpen,
    setIsDropdownOpen,
    searchContainerRef,
    handleSearch,
    searchFor,
    handleSelectPlace,
    clearSelectedPlace,
  };
}
