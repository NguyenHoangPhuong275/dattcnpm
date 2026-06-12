'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

const SLIDES = [
  '/images/hoian.png',
  '/images/hagiang.png',
  '/images/halongbay.png',
  '/images/hue.jpg',
];

interface HeroSliderProps {
  paused?: boolean;
}

export default function HeroSlider({ paused = false }: HeroSliderProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [baseBg, setBaseBg] = useState(SLIDES[0]);

  useEffect(() => {
    if (paused) return;

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
  }, [paused]);

  useEffect(() => {
    if (currentSlide === 0) return;
    const timer = setTimeout(() => {
      setBaseBg(SLIDES[currentSlide]);
    }, 3400);
    return () => clearTimeout(timer);
  }, [currentSlide]);

  return (
    <section className="relative flex h-[420px] w-full items-center justify-center overflow-hidden bg-slate-900 sm:h-[480px] md:h-[520px]">
      <div
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${baseBg}')` }}
      />

      <div className="absolute inset-0 z-[1]">
        {SLIDES.map((src, index) => (
          <Image
            key={src}
            src={src}
            alt=""
            fill
            sizes="100vw"
            className={`object-cover transition-opacity duration-700 ease-in-out ${
              currentSlide === index ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
            priority={index === 0}
          />
        ))}
      </div>

      <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/10 via-black/20 to-black/45" />

      <div className="relative z-20 mx-auto flex max-w-5xl select-none flex-col items-center px-6 text-center lg:px-8">
        <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight text-white drop-shadow-md sm:text-5xl md:text-6xl">
          LOTUS TRAVEL
        </h1>
        <p className="mt-4 max-w-2xl text-sm font-semibold text-white/90 drop-shadow-sm sm:text-base md:text-lg">
          Tìm điểm đến, xem thời tiết và lưu lịch trình du lịch Việt Nam trong một luồng gọn gàng.
        </p>
      </div>
    </section>
  );
}
