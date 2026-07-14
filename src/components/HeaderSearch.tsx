'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPinIcon } from '@/components/icons';
import { apiRequest, isAbortError } from '@/lib/api-client';

interface SearchSuggestion {
  _id: string;
  name: string;
  address?: string | null;
}

interface SuggestionEnvelope {
  success?: boolean;
  data?: { results?: SearchSuggestion[] };
}

interface HeaderSearchProps {
  visible: boolean;
  placeholder: string;
  onSubmit: (query: string) => void;
}

const SUGGEST_MIN_CHARS = 2;
const SUGGEST_DEBOUNCE_MS = 350;
const SUGGEST_LIMIT = 6;

export default function HeaderSearch({ visible, placeholder, onSubmit }: HeaderSearchProps): React.JSX.Element {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const query = input.trim();
    if (query.length < SUGGEST_MIN_CHARS) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    const controller = new AbortController();
    debounceRef.current = setTimeout(async () => {
      try {
        const { response, data } = await apiRequest<SuggestionEnvelope>(
          `/api/places/search?q=${encodeURIComponent(query)}`,
          { signal: controller.signal },
        );
        if (controller.signal.aborted) return;
        const results = response.ok && data.success ? data.data?.results ?? [] : [];
        setSuggestions(results.slice(0, SUGGEST_LIMIT));
        setOpen(results.length > 0);
      } catch (error: unknown) {
        if (isAbortError(error) || controller.signal.aborted) return;
        setSuggestions([]);
        setOpen(false);
      }
    }, SUGGEST_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      controller.abort();
    };
  }, [input]);

  const submit = (query: string): void => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setOpen(false);
    onSubmit(trimmed);
  };

  return (
    <div
      className={visible ? 'relative' : 'hidden'}
      aria-hidden={!visible}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') setOpen(false);
      }}
    >
      <form
        id="header-search-form"
        className="app-header-search app-composite-control"
        onSubmit={(event) => {
          event.preventDefault();
          submit(input);
        }}
      >
        <input
          id="header-search-input"
          aria-label="Tìm kiếm địa điểm"
          type="search"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onFocus={() => setOpen(suggestions.length > 0)}
          placeholder={placeholder}
          autoComplete="off"
          className="app-header-search-input app-search-input app-composite-input"
        />
      </form>

      {open && suggestions.length > 0 && (
        <ul className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-xl border border-[var(--color-border)] bg-white py-1 shadow-xl">
          {suggestions.map((suggestion) => (
            <li key={suggestion._id}>
              <button
                id={`header-search-suggestion-${suggestion._id}`}
                type="button"
                onClick={() => submit(suggestion.name)}
                className="flex w-full items-start gap-2.5 px-3.5 py-2.5 text-left transition-colors hover:bg-[var(--color-primary-lightest)]"
              >
                <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary-dark)]" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-[var(--color-text)]">{suggestion.name}</span>
                  {suggestion.address && (
                    <span className="block truncate text-xs text-[var(--color-text-muted)]">{suggestion.address}</span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
