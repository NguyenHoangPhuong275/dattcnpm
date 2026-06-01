"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export default function Home() {
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [redisStatus, setRedisStatus] = useState<any>(null);

  const [checkingHealth, setCheckingHealth] = useState(false);
  const [checkingDb, setCheckingDb] = useState(false);
  const [checkingRedis, setCheckingRedis] = useState(false);

  const checkHealth = async () => {
    setCheckingHealth(true);
    try {
      const res = await fetch("/api/health");
      const data = await res.json();
      setHealthStatus(data);
    } catch (err: any) {
      setHealthStatus({ status: "error", message: err.message });
    } finally {
      setCheckingHealth(false);
    }
  };

  const checkDb = async () => {
    setCheckingDb(true);
    try {
      const res = await fetch("/api/debug/db");
      const data = await res.json();
      setDbStatus(data);
    } catch (err: any) {
      setDbStatus({ status: "error", message: err.message });
    } finally {
      setCheckingDb(false);
    }
  };

  const checkRedis = async () => {
    setCheckingRedis(true);
    try {
      const res = await fetch("/api/debug/redis");
      const data = await res.json();
      setRedisStatus(data);
    } catch (err: any) {
      setRedisStatus({ status: "error", message: err.message });
    } finally {
      setCheckingRedis(false);
    }
  };

  useEffect(() => {
    checkHealth();
    checkDb();
    checkRedis();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-teal-500 selection:text-slate-900">
      {/* Premium Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-900/80 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-500 flex items-center justify-center font-bold text-slate-950 text-xl shadow-lg shadow-teal-500/20">
            S
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
              Smart Travel Guide
            </h1>
            <p className="text-xs text-slate-500 font-medium">Đồ án thực tế CNPM</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 uppercase tracking-wider animate-pulse">
            Tuần 1: Scaffold
          </span>
          <a
            href="file:///d:/LapTrinhAI/DATTCNPM/docs/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-400 hover:text-teal-400 font-medium transition-colors"
          >
            Tài liệu Thiết kế →
          </a>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-12 md:py-20 flex flex-col gap-16">
        <section className="text-center md:text-left flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 flex flex-col gap-6">
            <div className="inline-flex self-center md:self-start items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-teal-500"></span>
              Khởi tạo cấu trúc kỹ thuật nền tảng
            </div>
            <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
              Hành Trình Mới
              <br />
              <span className="bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                Thông Minh Hơn
              </span>
            </h2>
            <p className="text-slate-400 text-lg max-w-xl leading-relaxed">
              Hệ thống Tổng hợp & Gợi ý Du lịch Thông minh được xây dựng với cấu trúc hiện đại. 
              Giai đoạn Tuần 1 tập trung thiết kế kiến trúc MongoDB, Redis và scaffold thành công toàn bộ khung dự án Next.js 15+ App Router.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-4 justify-center md:justify-start">
              <a
                href="#endpoints"
                className="px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-teal-500/10 transition-transform duration-200 active:scale-95 text-center"
              >
                Kiểm tra Kết nối Hệ thống
              </a>
              <a
                href="https://github.com/NguyenHoangPhuong275/dattcnpm"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-slate-100 font-bold rounded-xl text-center transition-colors"
              >
                Xem Kho mã nguồn
              </a>
            </div>
          </div>

          <div className="flex-1 relative w-full max-w-md aspect-square rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800/80 p-8 flex flex-col justify-between shadow-2xl shadow-teal-950/20">
            {/* Visual background elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -ml-16 -mb-16"></div>

            <div className="flex justify-between items-start z-10">
              <div className="space-y-1">
                <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Thông tin sinh viên</span>
                <h3 className="text-xl font-bold text-slate-200">Nguyễn Hoàng Phương</h3>
                <p className="text-xs text-slate-400">MSSV: 080205010954 | Lớp: CN2303CLCA</p>
              </div>
              <span className="px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg text-[10px] text-slate-400 font-bold">
                UT-HCM
              </span>
            </div>

            <div className="space-y-4 z-10 mt-8">
              <div className="flex items-center gap-3 bg-slate-900/60 border border-slate-800/60 p-3 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-teal-950 flex items-center justify-center text-teal-400 text-xs font-bold">
                  DB
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-300">Cơ sở dữ liệu chính</h4>
                  <p className="text-[10px] text-slate-500">MongoDB Document Store</p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-slate-900/60 border border-slate-800/60 p-3 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-cyan-950 flex items-center justify-center text-cyan-400 text-xs font-bold">
                  CC
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-300">Bộ nhớ đệm & Giới hạn</h4>
                  <p className="text-[10px] text-slate-500">Redis Cache & Rate Limit</p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-slate-900/60 border border-slate-800/60 p-3 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-emerald-950 flex items-center justify-center text-emerald-400 text-xs font-bold">
                  AP
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-300">Tích hợp API thực tế</h4>
                  <p className="text-[10px] text-slate-500">OSM / Overpass / Nominatim / Weather</p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-900 flex justify-between items-center text-xs text-slate-500 z-10">
              <span>Đồ án thực tế CNPM 2026</span>
              <span>GVHD: Lê Văn Quốc Anh</span>
            </div>
          </div>
        </section>

        {/* Technical Health Section */}
        <section id="endpoints" className="space-y-8 scroll-mt-24">
          <div className="text-center max-w-xl mx-auto space-y-3">
            <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Bảng kiểm thử Kết nối Hệ thống
            </h3>
            <p className="text-slate-400 text-sm">
              Đảm bảo các container Docker MongoDB và Redis đã được khởi chạy. Bạn có thể nhấn nút "Kiểm tra lại" để cập nhật trực tiếp trạng thái kết nối.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Health Card */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between gap-6 hover:border-slate-700/80 transition-all duration-300 group">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 font-bold text-sm">
                    SYS
                  </div>
                  {healthStatus?.status === "ok" ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                      Hoạt động
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      Lỗi hệ thống
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-200 text-lg">Next.js Application</h4>
                  <p className="text-xs text-slate-500">Kiểm tra hoạt động chung: `/api/health`</p>
                </div>
                
                {healthStatus && (
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-900 font-mono text-[10px] text-slate-400 overflow-x-auto max-h-24">
                    <pre>{JSON.stringify(healthStatus, null, 2)}</pre>
                  </div>
                )}
              </div>

              <button
                onClick={checkHealth}
                disabled={checkingHealth}
                className="w-full py-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 hover:text-slate-100 font-semibold text-xs transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
                id="btn-check-sys"
              >
                {checkingHealth ? "Đang kiểm tra..." : "Kiểm tra lại"}
              </button>
            </div>

            {/* MongoDB Card */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between gap-6 hover:border-slate-700/80 transition-all duration-300 group">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-sm">
                    MDB
                  </div>
                  {dbStatus?.connected ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                      Kết nối tốt
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      Chưa kết nối
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-200 text-lg">MongoDB Database</h4>
                  <p className="text-xs text-slate-500">Mongoose Client: `/api/debug/db`</p>
                </div>
                
                {dbStatus && (
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-900 font-mono text-[10px] text-slate-400 overflow-x-auto max-h-24">
                    <pre>{JSON.stringify(dbStatus, null, 2)}</pre>
                  </div>
                )}
              </div>

              <button
                onClick={checkDb}
                disabled={checkingDb}
                className="w-full py-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 hover:text-slate-100 font-semibold text-xs transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
                id="btn-check-db"
              >
                {checkingDb ? "Đang kiểm tra..." : "Kiểm tra lại"}
              </button>
            </div>

            {/* Redis Card */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between gap-6 hover:border-slate-700/80 transition-all duration-300 group">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold text-sm">
                    RDS
                  </div>
                  {redisStatus?.connected ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                      Kết nối tốt
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      Chưa kết nối
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-200 text-lg">Redis Server</h4>
                  <p className="text-xs text-slate-500">ioredis Client (PING): `/api/debug/redis`</p>
                </div>
                
                {redisStatus && (
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-900 font-mono text-[10px] text-slate-400 overflow-x-auto max-h-24">
                    <pre>{JSON.stringify(redisStatus, null, 2)}</pre>
                  </div>
                )}
              </div>

              <button
                onClick={checkRedis}
                disabled={checkingRedis}
                className="w-full py-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 hover:text-slate-100 font-semibold text-xs transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
                id="btn-check-redis"
              >
                {checkingRedis ? "Đang kiểm tra..." : "Kiểm tra lại"}
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Simple Premium Footer */}
      <footer className="mt-20 border-t border-slate-900/60 py-8 bg-slate-950 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <p>© 2026 Smart Travel Guide. Báo cáo tiến độ hoàn thành Đồ án CNPM Tuần 1.</p>
          <div className="flex gap-6">
            <span>Sinh viên: Nguyễn Hoàng Phương</span>
            <span>Lớp: CN2303CLCA</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
