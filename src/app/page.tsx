'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import LoginForm from '@/components/auth/LoginForm';
import RegisterForm from '@/components/auth/RegisterForm';
import AppHeader from '@/components/AppHeader';
import * as Icons from '@/components/icons';
import { getApiErrorMessage } from '@/lib/api-client';

interface SearchResult {
  _id: string;
  name: string;
  type?: string;
  lat: number;
  lng: number;
  address?: string | null;
  osmId?: string | null;
}

const SLIDES = [
  '/images/hoian.png',
  '/images/hagiang.png',
  '/images/halongbay.png',
  '/images/hue.jpg',
];

export default function HomePage() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'manual';
      }
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });

      const params = new URLSearchParams(window.location.search);
      const authParam = params.get('auth');
      if (authParam === 'login' || authParam === 'register') {
        setAuthMode(authParam);
        setIsClosing(false);
      }

      const queryParam = params.get('q');
      if (queryParam) {
        setSearchQuery(queryParam);
        setTimeout(() => {
          performSearch(queryParam);
        }, 100);
      }
    }
  }, []);

  const [authMode, setAuthMode] = useState<'login' | 'register' | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<SearchResult | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchAbortControllerRef = useRef<AbortController | null>(null);

  const [weather, setWeather] = useState<{ temperature: number; description: string; weathercode: number } | null>(null);
  const [pois, setPois] = useState<Array<{ id: string; name: string; type: string; address: string }>>([]);
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);
  const [isPoisLoading, setIsPoisLoading] = useState(false);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [baseBg, setBaseBg] = useState(SLIDES[0]);

  useEffect(() => {
    if (!selectedPlace) {
      setWeather(null);
      setPois([]);
      return;
    }

    const fetchDetails = async () => {
      setIsWeatherLoading(true);
      setIsPoisLoading(true);

      const lat = selectedPlace.lat;
      const lng = selectedPlace.lng;

      fetch(`/api/weather?lat=${lat}&lng=${lng}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.weather) {
            setWeather(data.weather);
          }
        })
        .catch(() => null)
        .finally(() => setIsWeatherLoading(false));

      const isProvince = selectedPlace.address?.toLowerCase().includes('tỉnh') ||
                         selectedPlace.name.toLowerCase().startsWith('tỉnh') ||
                         ['hồ chí minh', 'hà nội', 'đà nẵng', 'hải phòng', 'cần thơ'].includes(selectedPlace.name.toLowerCase());
      const radius = isProvince ? 50000 : 10000;

      fetch(`/api/places/poi?lat=${lat}&lng=${lng}&radius=${radius}&type=tourism`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.results) {
            setPois(data.results);
          }
        })
        .catch(() => null)
        .finally(() => setIsPoisLoading(false));
    };

    fetchDetails();
  }, [selectedPlace]);

  const openAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setIsClosing(false);
  };

  const closeAuth = () => {
    if (!authMode) return;
    setIsClosing(true);
    setTimeout(() => {
      setAuthMode(null);
      setIsClosing(false);
    }, 220);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (searchAbortControllerRef.current) {
        searchAbortControllerRef.current.abort();
      }
    };
  }, []);

  const handleSearch = () => {
    const q = searchQuery.trim();
    if (q.length < 2) return;
    performSearch(q);
  };

  const handleSelectPlace = (place: SearchResult) => {
    setSelectedPlace(place);
    setSearchQuery(place.address || place.name);
    setSearchResults([]);
    setIsDropdownOpen(false);
  };

  const clearSelectedPlace = () => {
    setSelectedPlace(null);
    setSearchQuery('');
    setSearchResults([]);
    setIsDropdownOpen(false);
  };

  const performSearch = async (q: string) => {
    if (searchAbortControllerRef.current) {
      searchAbortControllerRef.current.abort();
    }
    const controller = new AbortController();
    searchAbortControllerRef.current = controller;

    setIsSearching(true);
    setSearchError(null);

    try {
      const res = await fetch(`/api/places/search?q=${encodeURIComponent(q)}`, {
        signal: controller.signal,
      });
      const data = await res.json();

      if (searchAbortControllerRef.current !== controller) return;

      if (!res.ok) {
        setSearchError(getApiErrorMessage(data, 'Không thể tìm kiếm'));
        setIsDropdownOpen(true);
        return;
      }

      if (data.results && data.results.length > 0) {
        setSearchResults(data.results);
        setIsDropdownOpen(true);
      } else {
        setSearchResults([]);
        setSearchError('Không tìm thấy địa điểm phù hợp. Thử từ khóa khác (ví dụ: Hà Nội, Đà Lạt, Hội An).');
        setIsDropdownOpen(true);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setSearchError('Lỗi kết nối. Vui lòng thử lại.');
      setIsDropdownOpen(true);
    } finally {
      if (searchAbortControllerRef.current === controller) {
        setIsSearching(false);
      }
    }
  };

  useEffect(() => {
    const q = searchQuery.trim();

    if (selectedPlace && (q === selectedPlace.name || q === selectedPlace.address)) {
      return;
    }

    if (q.length < 2) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }

    const timer = setTimeout(() => {
      performSearch(q);
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedPlace]);

  useEffect(() => {
    if (authMode) return;

    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    const preloadAndStart = async () => {
      await Promise.all(
        SLIDES.map((src) => {
          const img = new window.Image();
          img.src = src;
          return img.decode().catch(() => null);
        })
      );
      if (cancelled) return;

      setTimeout(() => {
        if (!cancelled) {
          timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
          }, 6200);
        }
      }, 120);
    };

    preloadAndStart();

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [authMode]);

  useEffect(() => {
    if (currentSlide === 0) return;
    const t = setTimeout(() => {
      setBaseBg(SLIDES[currentSlide]);
    }, 3400);
    return () => clearTimeout(t);
  }, [currentSlide]);

  return (
    <div className="min-h-screen bg-[var(--color-bg)] overflow-x-hidden">
      <AppHeader onAuthClick={openAuth} showSearch={false} />

      <section className="relative w-full h-[460px] sm:h-[520px] md:h-[560px] flex items-center justify-center bg-slate-900 overflow-hidden">
        <div
          className="absolute inset-0 z-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${baseBg}')` }}
        />

        <div className="absolute inset-0 z-[1]">
          {SLIDES.map((src, index) => (
            <Image
              key={index}
              src={src}
              alt=""
              fill
              sizes="100vw"
              className={`object-cover transition-opacity duration-700 ease-in-out ${
                currentSlide === index ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
              priority={index === 0}
            />
          ))}
        </div>

        <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-black/15 to-black/35 z-10" />

        <div className="relative z-20 max-w-5xl mx-auto text-center px-6 lg:px-8 flex flex-col items-center select-none">
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-tight drop-shadow-md">
            Welcome to LOTUS TRAVEL
          </h1>
          <p className="mt-4 text-sm sm:text-base md:text-lg text-white/90 max-w-2xl font-medium drop-shadow-sm">
            Hành trình dễ dàng – từ kết nối viễn thông, dịch vụ du lịch đến khám phá mọi điểm đến đáng nhớ.
          </p>
        </div>
      </section>

      <section className="relative w-full px-4 lg:px-8 xl:px-12 z-20 -mt-20 sm:-mt-24 md:-mt-28 mb-16">
        <div className="max-w-7xl mx-auto bg-white rounded-3xl p-6 md:p-8 border border-slate-100/80">
          <h2 className="text-slate-800 font-display font-bold text-xl md:text-2xl mb-6 text-center select-none">
            Tạo lịch trình
          </h2>

          <div className="space-y-4">
            <div ref={searchContainerRef} className="relative w-full">
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[var(--color-primary-darker)] transition-colors">
                  <Icons.MapPinIcon className="w-5 h-5" />
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSearchQuery(val);
                    if (selectedPlace && val !== selectedPlace.name && val !== selectedPlace.address) {
                      setSelectedPlace(null);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                  onFocus={() => {
                    if (searchResults.length > 0 || searchError) {
                      setIsDropdownOpen(true);
                    }
                  }}
                  id="destination-search-input"
                  placeholder="Chọn điểm đến"
                  className="w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200/80 focus:border-[var(--color-primary-dark)] rounded-2xl py-4 pl-12 pr-12 text-slate-800 placeholder:text-slate-400 outline-none transition-all text-base focus:ring-4 focus:ring-[var(--color-primary-lightest)] cursor-text"
                />
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center gap-2">
                  {isSearching ? (
                    <svg className="animate-spin h-5 w-5 text-[var(--color-primary-darker)]" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : selectedPlace ? (
                    <button
                      type="button"
                      onClick={clearSelectedPlace}
                      className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                      aria-label="Xóa địa điểm đã chọn"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSearch}
                      disabled={!searchQuery.trim()}
                      className="text-[var(--color-primary-darker)] hover:text-[var(--color-primary-dark)] disabled:opacity-50 transition-colors cursor-pointer"
                      aria-label="Tìm kiếm địa điểm"
                    >
                      <Icons.SearchIcon className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              {isDropdownOpen && searchResults.length > 0 && (
                <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-30 animate-fade-in-up">
                  <div className="px-4 py-2 text-xs font-semibold text-slate-500 bg-slate-50 border-b">
                    Kết quả tìm kiếm ({searchResults.length})
                  </div>
                  <div className="max-h-72 overflow-auto divide-y divide-slate-100">
                    {searchResults.map((place) => {
                      const isSelected = selectedPlace?._id === place._id;

                      return (
                        <button
                          key={place._id}
                          onClick={() => handleSelectPlace(place)}
                          className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer flex items-start gap-3 ${isSelected ? 'bg-[var(--color-primary-lightest)]' : ''}`}
                        >
                          <div className="mt-0.5 text-[var(--color-primary-darker)]">
                            <Icons.MapPinIcon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-slate-800 truncate">{place.name}</div>
                            {place.address && place.address !== place.name && (
                              <div className="text-sm text-slate-500 truncate">{place.address}</div>
                            )}
                          </div>
                          {isSelected && (
                            <div className="text-emerald-600 text-xs font-medium self-center">ĐÃ CHỌN</div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {isDropdownOpen && searchError && searchQuery.trim().length >= 2 && (
                <div className="absolute left-0 right-0 mt-2 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-sm text-amber-700 z-30 shadow-lg">
                  {searchError}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-0 border border-slate-200/70 rounded-2xl p-2 items-center bg-slate-50/20">
              <div className="flex flex-col px-4 py-2 md:border-r md:border-slate-200/60 select-none group cursor-pointer">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Ngày đi</span>
                <div className="flex items-center gap-2">
                  <Icons.CalendarIcon className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors flex-shrink-0" />
                  <input
                    type="date"
                    className="bg-transparent border-none outline-none text-slate-800 text-sm font-semibold w-full focus:ring-0 cursor-pointer p-0"
                    defaultValue={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              <div className="flex flex-col px-4 py-2 md:border-r md:border-slate-200/60 select-none group cursor-pointer">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Ngày về</span>
                <div className="flex items-center gap-2">
                  <Icons.CalendarIcon className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors flex-shrink-0" />
                  <input
                    type="date"
                    className="bg-transparent border-none outline-none text-slate-800 text-sm font-semibold w-full focus:ring-0 cursor-pointer p-0"
                    defaultValue={new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]}
                  />
                </div>
              </div>

              <div className="flex flex-col px-4 py-2 md:border-r md:border-slate-200/60 select-none group cursor-pointer">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Số người</span>
                <div className="flex items-center gap-2">
                  <Icons.UsersIcon className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors flex-shrink-0" />
                  <input
                    type="number"
                    min="1"
                    max="100"
                    defaultValue="2"
                    className="bg-transparent border-none outline-none text-slate-800 text-sm font-semibold w-full focus:ring-0 cursor-pointer p-0"
                  />
                </div>
              </div>

              <div className="flex items-center justify-center p-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!selectedPlace) {
                      const searchInput = document.getElementById('destination-search-input') as HTMLInputElement;
                      searchInput?.focus();
                      return;
                    }
                    openAuth('register');
                  }}
                  className={`w-full py-3 font-bold rounded-full transition-all cursor-pointer shadow-md text-sm tracking-wide whitespace-nowrap text-center ${
                    selectedPlace
                      ? 'bg-[var(--color-primary-darker)] hover:bg-[var(--color-primary-dark)] text-white active:scale-[0.98]'
                      : 'bg-slate-100 hover:bg-slate-200 text-[var(--color-primary-darker)] border border-[var(--color-border)] disabled:opacity-60'
                  }`}
                  disabled={!selectedPlace}
                >
                  {selectedPlace ? 'TẠO LỊCH TRÌNH' : 'CHỌN ĐỊA ĐIỂM ĐỂ BẮT ĐẦU'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {selectedPlace && (
          <div className="mt-8 max-w-7xl mx-auto bg-white rounded-3xl shadow-[0_10px_45px_rgba(0,0,0,0.08)] p-6 md:p-8 border border-slate-100/80 transition-all duration-300">
            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex-1 space-y-6">
                <div>
                  <span className="text-xs font-bold text-[var(--color-primary-darker)] uppercase tracking-wider">Điểm đến đã chọn</span>
                  <h3 className="font-display text-2xl font-bold text-slate-800 mt-1">{selectedPlace.name}</h3>
                  {selectedPlace.address && (
                    <p className="text-sm text-slate-500 mt-1">{selectedPlace.address}</p>
                  )}
                </div>

                <div className="border-t border-slate-100 pt-6">
                  <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <Icons.WeatherIcon code={0} className="w-4 h-4 text-amber-500" />
                    Thời tiết hiện tại
                  </h4>

                  {isWeatherLoading ? (
                    <div className="animate-pulse flex gap-4 items-center">
                      <div className="w-12 h-12 bg-slate-100 rounded-full"></div>
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-slate-100 rounded w-16"></div>
                        <div className="h-3 bg-slate-100 rounded w-24"></div>
                      </div>
                    </div>
                  ) : weather ? (
                    <div className="flex items-center gap-6 bg-slate-50 rounded-2xl p-4">
                      <Icons.WeatherIcon code={weather.weathercode} className="w-10 h-10 text-amber-500" />
                      <div>
                        <div className="text-2xl font-bold text-slate-800">{weather.temperature}°C</div>
                        <div className="text-sm font-medium text-slate-500">{weather.description}</div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">Không thể tải thông tin thời tiết lúc này.</p>
                  )}
                </div>
              </div>

              <div className="flex-[1.5] border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-8">
                <h4 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Địa danh du lịch nổi bật
                </h4>

                {isPoisLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="animate-pulse border border-slate-100 rounded-2xl p-4 space-y-3">
                        <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                        <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : pois.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-2">
                    {pois.map((poi) => (
                      <div key={poi.id} className="border border-slate-100 rounded-2xl p-4 hover:border-slate-200 hover:shadow-sm transition-all flex flex-col justify-between">
                        <div>
                          <div className="font-semibold text-slate-800 text-sm line-clamp-2">{poi.name}</div>
                          <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mt-1">{poi.type}</div>
                        </div>
                        {poi.address && poi.address !== 'Xung quanh khu vực này' && (
                          <div className="text-xs text-slate-500 mt-2 truncate">{poi.address}</div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400 text-sm">
                    Không tìm thấy địa danh du lịch nổi bật xung quanh khu vực này.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="py-12 sm:py-16 px-4 lg:px-8 xl:px-12 border-t border-[var(--color-border)] bg-white">
        <div className="w-full">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="font-display text-3xl font-bold text-[var(--color-text)]">Gợi ý điểm đến</h2>
              <p className="text-[var(--color-text-secondary)] mt-1 text-sm">Các địa điểm du lịch phổ biến (sẽ mở rộng sau)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-64 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white flex items-center justify-center text-[var(--color-text-muted)] text-sm">
                Gợi ý điểm đến #{i}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 px-4 lg:px-8 xl:px-12 border-t border-[var(--color-border)] bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-display text-3xl font-bold text-[var(--color-text)] mb-2">Cách hoạt động</h2>
          <p className="text-[var(--color-text-secondary)] mb-8 text-sm">Chỉ với vài bước đơn giản</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="p-6 rounded-2xl border border-[var(--color-border)] bg-white text-left">
                <div className="text-3xl font-bold text-[var(--color-primary-darker)] mb-3">{i}</div>
                <h3 className="font-semibold mb-2">Bước {i}</h3>
                <p className="text-sm text-[var(--color-text-secondary)]">Mô tả ngắn gọn cho bước {i}.</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 px-4 lg:px-8 xl:px-12 border-t border-[var(--color-border)] bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-display text-3xl font-bold text-[var(--color-text)] mb-2">Người dùng nói gì?</h2>
          <p className="text-[var(--color-text-secondary)] mb-8 text-sm">Hàng nghìn hành trình đã được lên kế hoạch</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map(i => (
              <div key={i} className="p-6 rounded-2xl border border-[var(--color-border)] bg-white text-left">
                <p className="text-[var(--color-text-secondary)] mb-4">“Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut elit tellus, luctus nec ullamcorper mattis.”</p>
                <div className="font-medium text-sm">— Người dùng {i}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 px-4 lg:px-8 xl:px-12 border-t border-[var(--color-border)] bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-[var(--color-text)] mb-4">
            Sẵn sàng lên đường?
          </h2>
          <p className="text-lg text-[var(--color-text-secondary)] mb-8">
            Tạo tài khoản miễn phí và bắt đầu lập kế hoạch cho chuyến đi tiếp theo ngay hôm nay.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => openAuth('register')}
              className="px-8 py-3.5 bg-[var(--color-primary-darker)] text-white font-semibold rounded-full hover:bg-[var(--color-primary-dark)] transition-all cursor-pointer shadow-sm"
            >
              Tạo tài khoản miễn phí
            </button>
            <button
              onClick={() => openAuth('login')}
              className="px-8 py-3.5 border border-[var(--color-border-strong)] font-medium rounded-full hover:bg-white transition-all cursor-pointer"
            >
              Đã có tài khoản? Đăng nhập ngay
            </button>
          </div>
        </div>
      </section>

      {authMode && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className={`absolute inset-0 bg-black/60 transition-opacity duration-200 ${isClosing ? 'opacity-0' : 'opacity-100'}`}
            onClick={closeAuth}
          />

          <div
            className={`relative w-full max-w-[850px] h-[580px] md:h-[620px] bg-white rounded-[24px] overflow-hidden shadow-2xl flex flex-col md:flex-row z-10 border border-slate-100 ${isClosing ? 'auth-slide closing' : 'auth-slide'}`}
            onClick={e => e.stopPropagation()}
          >
            <div className="relative w-full md:w-[48%] h-48 md:h-full overflow-hidden bg-slate-100 flex-shrink-0">
              <Image
                src="/images/hoian_auth.png"
                alt="Phố cổ Hội An"
                fill
                sizes="(max-width: 768px) 100vw, 408px"
                className="object-cover"
              />
              <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center gap-1.5 pointer-events-none">
                <span className={`h-1.5 rounded-full bg-white transition-all duration-300 ${authMode === 'login' ? 'w-5 opacity-100' : 'w-1.5 opacity-40'}`} />
                <span className={`h-1.5 rounded-full bg-white transition-all duration-300 ${authMode === 'register' ? 'w-5 opacity-100' : 'w-1.5 opacity-40'}`} />
                <span className="w-1.5 h-1.5 rounded-full bg-white opacity-40" />
              </div>
            </div>

            <div className="relative flex-1 p-6 sm:p-8 md:p-10 flex flex-col bg-white h-full justify-between">
              <button
                onClick={closeAuth}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer z-10"
                aria-label="Đóng"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="flex flex-col flex-1 h-full justify-between">
                <h2 className="text-2xl font-bold text-slate-900 text-center mb-6 flex-shrink-0">
                  {authMode === 'login' ? 'Đăng nhập' : 'Đăng ký'}
                </h2>

                <div className="flex-1 flex flex-col pr-1">
                  {authMode === 'login' ? (
                    <LoginForm onSuccess={closeAuth} />
                  ) : (
                    <RegisterForm onSuccess={closeAuth} />
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200/70 text-center text-xs text-slate-500 flex-shrink-0">
                  {authMode === 'login' ? (
                    <>
                      Chưa có tài khoản?{' '}
                      <button
                        onClick={() => openAuth('register')}
                        className="font-semibold text-[var(--color-primary-darker)] hover:underline transition-colors"
                      >
                        Đăng ký ngay
                      </button>
                    </>
                  ) : (
                    <>
                      Đã có tài khoản?{' '}
                      <button
                        onClick={() => openAuth('login')}
                        className="font-semibold text-[var(--color-primary-darker)] hover:underline transition-colors"
                      >
                        Đăng nhập
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


