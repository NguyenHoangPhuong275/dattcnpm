"use client";

import { useState, useEffect } from "react";

// Mock Data for Smart Travel Guide (Da Lat theme)
const MOCK_POIS = [
  {
    id: "poi-1",
    name: "Hồ Xuân Hương",
    type: "Thiên nhiên / Cảnh quan",
    desc: "Trái tim xanh của thành phố Đà Lạt với rừng thông thơ mộng ôm trọn mặt hồ.",
    lat: 11.9416,
    lng: 108.4452,
    rating: 4.8,
    tags: ["Thư giãn", "Chụp ảnh", "Đi bộ"],
    img: "/images/ho_xuan_huong.png",
  },
  {
    id: "poi-2",
    name: "Thung Lũng Tình Yêu",
    type: "Địa danh / Vui chơi",
    desc: "Thung lũng ngập tràn sắc hoa hữu tình, thích hợp cho các cặp đôi và gia đình tham quan.",
    lat: 11.9772,
    lng: 108.4485,
    rating: 4.5,
    tags: ["Lãng mạn", "Tham quan", "Gia đình"],
    img: "/images/thung_lung_tinh_yeu.png",
  },
  {
    id: "poi-3",
    name: "Đỉnh Langbiang",
    type: "Mạo hiểm / Leo núi",
    desc: "Nóc nhà của Đà Lạt với góc nhìn toàn cảnh cao nguyên Lâm Viên hùng vĩ từ độ cao 2.167m.",
    lat: 12.0294,
    lng: 108.4378,
    rating: 4.7,
    tags: ["Leo núi", "Trekking", "Văn hóa"],
    img: "/images/dinh_langbiang.png",
  },
];

const MOCK_TRIP = {
  title: "Khám Phá Sương Mù Đà Lạt",
  destination: "Đà Lạt, Lâm Đồng",
  duration: "3 Ngày 2 Đêm",
  itinerary: [
    {
      day: 1,
      title: "Hành Trình Chào Đất Hoa",
      items: [
        { time: "09:00", activity: "Đáp sân bay Liên Khương, di chuyển về homestay" },
        { time: "14:00", activity: "Tản bộ quanh Hồ Xuân Hương & uống cà phê ngắm cảnh" },
        { time: "19:00", activity: "Ăn đồ nướng ngói và dạo Chợ Đêm Đà Lạt" },
      ],
    },
    {
      day: 2,
      title: "Chinh Phục Nóc Nhà Cao Nguyên",
      items: [
        { time: "07:30", activity: "Leo núi Langbiang bằng xe Jeep ngắm mây phủ" },
        { time: "13:30", activity: "Ghé thăm Thung Lũng Tình Yêu & đồi mộng mơ" },
        { time: "18:00", activity: "Dùng bữa tối chay thanh đạm gần chùa Ve Chai" },
      ],
    },
    {
      day: 3,
      title: "Hẹn Gặp Lại Đà Lạt",
      items: [
        { time: "08:00", activity: "Check-in Vườn hoa thành phố chụp ảnh kỷ niệm" },
        { time: "11:00", activity: "Mua quà lưu niệm (mứt, dâu tây, hoa khô) tại Chợ Đà Lạt" },
        { time: "15:00", activity: "Di chuyển ra sân bay kết thúc hành trình đẹp" },
      ],
    },
  ],
};

export default function Home() {
  const [selectedPoi, setSelectedPoi] = useState(MOCK_POIS[0]);
  const [activeDay, setActiveDay] = useState(1);
  const [showDevStatus, setShowDevStatus] = useState(false);

  // Connection API statuses
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
    <div className="min-h-screen bg-[#F8F5F0] text-[#2C2C2C] font-sans selection:bg-[#E07A5F] selection:text-white pb-20">
      
      {/* Nature Floating Navbar */}
      <nav className="fixed top-4 left-4 right-4 z-40 bg-white/80 backdrop-blur-md border border-black/[0.05] rounded-full px-6 py-3.5 flex items-center justify-between shadow-[0_4px_20px_-4px_rgba(45,90,90,0.08)]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#2D5A5A] flex items-center justify-center text-[#F8F5F0] font-black text-sm">
            ⛰️
          </div>
          <div>
            <span className="font-bold text-sm text-[#2D5A5A] uppercase tracking-wider block leading-tight">
              Smart Travel
            </span>
            <span className="text-[10px] text-[#6B6B6B] font-semibold leading-tight block">
              Hệ thống Gợi ý Du lịch Thông minh
            </span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-[#6B6B6B]">
          <a href="#about" className="hover:text-[#2D5A5A] transition-colors cursor-pointer">Giới thiệu</a>
          <a href="#pois" className="hover:text-[#2D5A5A] transition-colors cursor-pointer">Địa điểm (POIs)</a>
          <a href="#itinerary" className="hover:text-[#2D5A5A] transition-colors cursor-pointer">Lịch trình mẫu</a>
          <a href="#diagnostics" className="hover:text-[#2D5A5A] transition-colors cursor-pointer">Kết nối Kỹ thuật</a>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDevStatus(!showDevStatus)}
            className="cursor-pointer text-xs font-bold px-3 py-1.5 rounded-full bg-[#E07A5F]/10 border border-[#E07A5F]/20 text-[#E07A5F] transition-all hover:bg-[#E07A5F]/20"
          >
            🔌 Dev Status
          </button>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#2D5A5A]/10 border border-[#2D5A5A]/25 text-[#2D5A5A]">
            Tuần 1: Setup
          </span>
        </div>
      </nav>

      {/* Floating System Diagnostics Sidebar */}
      {showDevStatus && (
        <div className="fixed inset-y-0 right-0 w-80 bg-white/95 backdrop-blur-md shadow-2xl border-l border-black/[0.08] z-50 p-6 flex flex-col justify-between overflow-y-auto transition-transform duration-300">
          <div className="space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-black/[0.05]">
              <div>
                <h4 className="font-bold text-[#2D5A5A]">Hạ tầng Docker</h4>
                <p className="text-[10px] text-[#6B6B6B]">Trạng thái kết nối dịch vụ Tuần 1</p>
              </div>
              <button
                onClick={() => setShowDevStatus(false)}
                className="cursor-pointer text-sm font-bold text-[#6B6B6B] hover:text-black"
              >
                ✕
              </button>
            </div>

            {/* Health checks */}
            <div className="space-y-4">
              {/* Sys */}
              <div className="bg-[#F8F5F0] p-4 rounded-xl border border-black/[0.03] space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-[#2D5A5A]">Next.js Health</span>
                  {healthStatus?.status === "ok" ? (
                    <span className="text-[9px] font-bold bg-[#4A7C59]/10 border border-[#4A7C59]/20 text-[#4A7C59] px-2 py-0.5 rounded-full">
                      ONLINE
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold bg-[#B45309]/10 border border-[#B45309]/20 text-[#B45309] px-2 py-0.5 rounded-full">
                      OFFLINE
                    </span>
                  )}
                </div>
                {healthStatus && (
                  <pre className="text-[9px] font-mono text-[#6B6B6B] bg-white p-2 rounded border border-black/[0.03] overflow-x-auto max-h-16">
                    {JSON.stringify(healthStatus, null, 2)}
                  </pre>
                )}
                <button
                  onClick={checkHealth}
                  disabled={checkingHealth}
                  className="cursor-pointer w-full py-1 text-[10px] font-bold bg-white hover:bg-slate-50 border border-black/[0.05] rounded text-[#6B6B6B] disabled:opacity-50"
                >
                  {checkingHealth ? "Checking..." : "Ping /api/health"}
                </button>
              </div>

              {/* DB */}
              <div className="bg-[#F8F5F0] p-4 rounded-xl border border-black/[0.03] space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-[#2D5A5A]">MongoDB</span>
                  {dbStatus?.connected ? (
                    <span className="text-[9px] font-bold bg-[#4A7C59]/10 border border-[#4A7C59]/20 text-[#4A7C59] px-2 py-0.5 rounded-full">
                      CONNECTED
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold bg-[#B45309]/10 border border-[#B45309]/20 text-[#B45309] px-2 py-0.5 rounded-full">
                      DISCONNECTED
                    </span>
                  )}
                </div>
                {dbStatus && (
                  <pre className="text-[9px] font-mono text-[#6B6B6B] bg-white p-2 rounded border border-black/[0.03] overflow-x-auto max-h-16">
                    {JSON.stringify(dbStatus, null, 2)}
                  </pre>
                )}
                <button
                  onClick={checkDb}
                  disabled={checkingDb}
                  className="cursor-pointer w-full py-1 text-[10px] font-bold bg-white hover:bg-slate-50 border border-black/[0.05] rounded text-[#6B6B6B] disabled:opacity-50"
                >
                  {checkingDb ? "Checking..." : "Test Mongoose Connection"}
                </button>
              </div>

              {/* Redis */}
              <div className="bg-[#F8F5F0] p-4 rounded-xl border border-black/[0.03] space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-[#2D5A5A]">Redis Cache</span>
                  {redisStatus?.connected ? (
                    <span className="text-[9px] font-bold bg-[#4A7C59]/10 border border-[#4A7C59]/20 text-[#4A7C59] px-2 py-0.5 rounded-full">
                      CONNECTED
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold bg-[#B45309]/10 border border-[#B45309]/20 text-[#B45309] px-2 py-0.5 rounded-full">
                      DISCONNECTED
                    </span>
                  )}
                </div>
                {redisStatus && (
                  <pre className="text-[9px] font-mono text-[#6B6B6B] bg-white p-2 rounded border border-black/[0.03] overflow-x-auto max-h-16">
                    {JSON.stringify(redisStatus, null, 2)}
                  </pre>
                )}
                <button
                  onClick={checkRedis}
                  disabled={checkingRedis}
                  className="cursor-pointer w-full py-1 text-[10px] font-bold bg-white hover:bg-slate-50 border border-black/[0.05] rounded text-[#6B6B6B] disabled:opacity-50"
                >
                  {checkingRedis ? "Checking..." : "Test Redis Ping"}
                </button>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-black/[0.05] text-[10px] text-[#6B6B6B] text-center space-y-1">
            <p><strong>Sinh viên:</strong> Nguyễn Hoàng Phương</p>
            <p>MSSV: 080205010954 | Lớp: CN2303CLCA</p>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <main className="pt-32 max-w-6xl mx-auto w-full px-6 flex flex-col gap-24">
        
        {/* Intro */}
        <section id="about" className="flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#2D5A5A]/10 border border-[#2D5A5A]/20 text-[#2D5A5A] text-xs font-bold uppercase tracking-wider">
              <span>🍃</span> Giao diện Soft UI Nature Distilled
            </div>
            
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight text-[#2D5A5A]">
              Lập Kế Hoạch Cho
              <br />
              <span className="text-[#E07A5F]">Hành Trình Hoàn Hảo</span>
            </h1>
            
            <p className="text-[#6B6B6B] text-base md:text-lg leading-relaxed max-w-xl">
              Hệ thống <strong>Smart Travel Guide</strong> là người bạn đồng hành tin cậy, tự động tổng hợp, tìm kiếm địa danh và tối ưu hóa lịch trình du lịch dựa trên các thuộc tính sở thích và vị trí địa lý của bạn. 
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="#pois"
                className="cursor-pointer px-6 py-3 bg-[#E07A5F] hover:bg-[#E07A5F]/95 text-white font-bold rounded-full shadow-[0_4px_14px_-2px_rgba(224,122,95,0.3)] transition-transform duration-200 active:scale-95 text-center text-sm"
              >
                Khám Phá Địa Điểm (POIs)
              </a>
              <a
                href="#diagnostics"
                className="cursor-pointer px-6 py-3 bg-white hover:bg-slate-50 border border-black/[0.08] text-[#2D5A5A] font-bold rounded-full transition-colors text-center text-sm"
              >
                Kiểm Tra Hạ Tầng Tuần 1
              </a>
            </div>

            {/* Student info box */}
            <div className="pt-6 border-t border-black/[0.06] flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#E07A5F] flex items-center justify-center font-bold text-white text-xs">
                NP
              </div>
              <div className="text-xs">
                <p className="font-bold text-[#2D5A5A]">Nguyễn Hoàng Phương</p>
                <p className="text-[#6B6B6B]">MSSV: 080205010954 | Lớp: CN2303CLCA</p>
              </div>
            </div>
          </div>

          {/* Interactive Mock App UI */}
          <div className="flex-1 w-full max-w-md bg-white rounded-3xl p-6 border border-black/[0.05] shadow-[0_12px_40px_-6px_rgba(45,90,90,0.06)] flex flex-col gap-6">
            <div className="flex justify-between items-center pb-3 border-b border-black/[0.04]">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#E07A5F]"></span>
                <span className="font-bold text-xs text-[#2D5A5A] uppercase tracking-wider">Homestay & Hotel Planner</span>
              </div>
              <span className="text-[10px] text-[#6B6B6B] font-bold bg-[#F8F5F0] border border-black/[0.03] px-2 py-0.5 rounded">
                Da Lat City Map
              </span>
            </div>

            {/* Travel Card Highlight */}
            <div className="relative aspect-video rounded-2xl overflow-hidden shadow-inner group">
              <img
                src={selectedPoi.img}
                alt={selectedPoi.name}
                className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-4">
                <span className="text-[9px] font-bold bg-[#E07A5F] text-white px-2 py-0.5 rounded-full w-fit mb-1.5">
                  {selectedPoi.type}
                </span>
                <h3 className="text-white font-bold text-lg leading-tight">{selectedPoi.name}</h3>
                <p className="text-white/80 text-[10px] truncate">{selectedPoi.desc}</p>
              </div>
            </div>

            {/* Simulated Live Map Data */}
            <div className="bg-[#F8F5F0] p-4 rounded-2xl border border-black/[0.03] space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-[#2D5A5A]">Tọa độ hệ thống (OSM):</span>
                <span className="font-mono text-[10px] text-[#E07A5F] font-bold">
                  {selectedPoi.lat.toFixed(4)}° N, {selectedPoi.lng.toFixed(4)}° E
                </span>
              </div>
              <div className="h-2 w-full bg-black/[0.03] rounded-full overflow-hidden">
                <div className="h-full bg-[#2D5A5A] w-3/4 rounded-full"></div>
              </div>
              <p className="text-[10px] text-[#6B6B6B] leading-relaxed">
                Khi thực hiện tìm kiếm, các điểm POI xung quanh sẽ tự động được Mongoose xử lý thông qua Geo-query 2dsphere index và lưu trữ tạm trong bộ đệm Redis TTL 12h.
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <a
                href="#pois"
                className="flex-1 py-2.5 bg-[#2D5A5A] text-white font-bold rounded-xl text-xs text-center hover:bg-[#2D5A5A]/95 transition-all"
              >
                Xem các điểm khác
              </a>
              <button 
                onClick={() => setShowDevStatus(true)}
                className="cursor-pointer px-4 bg-[#F8F5F0] border border-black/[0.04] rounded-xl flex items-center justify-center text-xs text-[#2D5A5A] hover:bg-[#2D5A5A]/5 transition-all"
              >
                ⚙️ Status
              </button>
            </div>
          </div>
        </section>

        {/* POI Section */}
        <section id="pois" className="space-y-8 scroll-mt-28">
          <div className="text-center max-w-xl mx-auto space-y-3">
            <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-[#2D5A5A]">
              Điểm Tham Quan Xung Quanh (POIs)
            </h2>
            <p className="text-[#6B6B6B] text-sm leading-relaxed">
              Các địa danh lấy trực tiếp từ API OpenStreetMap. Hãy chọn từng địa điểm dưới đây để cập nhật bản đồ xem trước giả lập phía trên.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {MOCK_POIS.map((poi) => (
              <div
                key={poi.id}
                onClick={() => setSelectedPoi(poi)}
                className={`cursor-pointer bg-white border rounded-3xl p-5 flex flex-col justify-between gap-5 transition-all duration-300 ${
                  selectedPoi.id === poi.id
                    ? "border-[#E07A5F] shadow-[0_8px_30px_-6px_rgba(224,122,95,0.12)] scale-[1.02]"
                    : "border-black/[0.05] hover:border-[#2D5A5A]/30 hover:scale-[1.01]"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-[#E07A5F] bg-[#E07A5F]/10 border border-[#E07A5F]/15 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {poi.type}
                    </span>
                    <span className="text-xs font-bold text-amber-500 flex items-center gap-1">
                      ⭐ {poi.rating}
                    </span>
                  </div>
                  <h3 className="font-bold text-[#2D5A5A] text-lg">{poi.name}</h3>
                  <p className="text-xs text-[#6B6B6B] leading-relaxed">{poi.desc}</p>
                </div>

                <div className="pt-3 border-t border-black/[0.04] flex flex-wrap gap-1.5">
                  {poi.tags.map((t) => (
                    <span key={t} className="text-[9px] font-bold bg-[#F8F5F0] text-[#6B6B6B] border border-black/[0.03] px-2 py-0.5 rounded-md">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Itinerary Section */}
        <section id="itinerary" className="space-y-8 scroll-mt-28">
          <div className="text-center max-w-xl mx-auto space-y-3">
            <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-[#2D5A5A]">
              Lịch Trình Chi Tiết Chuyến Đi
            </h2>
            <p className="text-[#6B6B6B] text-sm">
              Xem mẫu lịch trình du lịch Đà Lạt 3 Ngày 2 Đêm được tạo bởi tính năng Quản lý chuyến đi.
            </p>
          </div>

          <div className="bg-white border border-black/[0.05] rounded-3xl p-6 md:p-8 shadow-[0_8px_30px_-6px_rgba(45,90,90,0.02)] flex flex-col md:flex-row gap-8">
            {/* Days Selector */}
            <div className="md:w-1/4 flex md:flex-col gap-2 border-b md:border-b-0 md:border-r border-black/[0.05] pb-4 md:pb-0 md:pr-6">
              {MOCK_TRIP.itinerary.map((d) => (
                <button
                  key={d.day}
                  onClick={() => setActiveDay(d.day)}
                  className={`cursor-pointer w-full text-left py-3 px-4 rounded-2xl font-bold text-xs flex justify-between items-center transition-all ${
                    activeDay === d.day
                      ? "bg-[#2D5A5A] text-white shadow-lg shadow-[#2D5A5A]/10"
                      : "bg-[#F8F5F0] text-[#6B6B6B] border border-black/[0.03] hover:bg-slate-50"
                  }`}
                >
                  <span>Ngày {d.day}</span>
                  <span className="text-[10px] opacity-85">Xem chi tiết</span>
                </button>
              ))}
              <div className="hidden md:block pt-6 mt-4 border-t border-black/[0.04] text-[10px] text-[#6B6B6B] leading-relaxed">
                <strong>Chuyến đi:</strong> {MOCK_TRIP.title}<br />
                <strong>Thời gian:</strong> {MOCK_TRIP.duration}<br />
                <strong>Điểm đến:</strong> {MOCK_TRIP.destination}
              </div>
            </div>

            {/* Timeline Details */}
            <div className="flex-1 space-y-6">
              <div>
                <h3 className="text-lg font-extrabold text-[#2D5A5A]">
                  Lịch trình Ngày {activeDay}: {MOCK_TRIP.itinerary[activeDay - 1].title}
                </h3>
                <p className="text-xs text-[#6B6B6B]">Mã hành động ghi Audit Log khi thay đổi: `PLAN_ITINERARY`</p>
              </div>

              <div className="relative border-l border-[#2D5A5A]/30 pl-6 ml-2 space-y-6">
                {MOCK_TRIP.itinerary[activeDay - 1].items.map((item, idx) => (
                  <div key={idx} className="relative group">
                    {/* Timeline dot */}
                    <span className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-[#E07A5F] border-2 border-white shadow flex items-center justify-center text-[8px]"></span>
                    
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-[#E07A5F] font-mono">{item.time}</span>
                      <h4 className="font-bold text-[#2D5A5A] text-sm">{item.activity}</h4>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Dev Connection Cards Section */}
        <section id="diagnostics" className="space-y-8 scroll-mt-28 pt-8 border-t border-black/[0.06]">
          <div className="text-center max-w-xl mx-auto space-y-3">
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#2D5A5A]">
              Bảng Chẩn Đoán Trạng Thái Kết Nối
            </h2>
            <p className="text-[#6B6B6B] text-xs leading-relaxed">
              Các Debug Endpoints được thiết kế bảo mật bằng cơ chế chặn IP khi chuyển lên môi trường Production. Ở môi trường Local Dev, các kết nối kỹ thuật này luôn thông suốt.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Health Card */}
            <div className="bg-white border border-black/[0.05] rounded-3xl p-6 flex flex-col justify-between gap-6 hover:shadow-lg transition-all duration-300">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 rounded-2xl bg-[#2D5A5A]/10 border border-[#2D5A5A]/15 flex items-center justify-center text-[#2D5A5A] font-bold text-xs uppercase tracking-wider">
                    sys
                  </div>
                  {healthStatus?.status === "ok" ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#4A7C59]/10 text-[#4A7C59] border border-[#4A7C59]/15">
                      ĐANG CHẠY
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#B45309]/10 text-[#B45309] border border-[#B45309]/15">
                      SỰ CỐ
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-[#2D5A5A] text-base">Next.js Health Route</h4>
                  <p className="text-[10px] text-[#6B6B6B]">Endpoint kiểm tra dịch vụ: `/api/health`</p>
                </div>
                
                {healthStatus && (
                  <pre className="bg-[#F8F5F0] p-3 rounded-xl border border-black/[0.03] font-mono text-[9px] text-[#6B6B6B] overflow-x-auto max-h-24">
                    {JSON.stringify(healthStatus, null, 2)}
                  </pre>
                )}
              </div>

              <button
                onClick={checkHealth}
                disabled={checkingHealth}
                className="cursor-pointer w-full py-2 bg-[#F8F5F0] hover:bg-slate-50 border border-black/[0.04] text-[#2D5A5A] font-bold rounded-xl text-xs transition-colors"
              >
                {checkingHealth ? "Đang kiểm tra..." : "Kiểm tra lại"}
              </button>
            </div>

            {/* MongoDB Card */}
            <div className="bg-white border border-black/[0.05] rounded-3xl p-6 flex flex-col justify-between gap-6 hover:shadow-lg transition-all duration-300">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 rounded-2xl bg-[#4A7C59]/10 border border-[#4A7C59]/15 flex items-center justify-center text-[#4A7C59] font-bold text-xs uppercase tracking-wider">
                    mdb
                  </div>
                  {dbStatus?.connected ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#4A7C59]/10 text-[#4A7C59] border border-[#4A7C59]/15">
                      KẾT NỐI TỐT
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#B45309]/10 text-[#B45309] border border-[#B45309]/15">
                      CHƯA KẾT NỐI
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-[#2D5A5A] text-base">MongoDB database</h4>
                  <p className="text-[10px] text-[#6B6B6B]">Mongoose Connection: `/api/debug/db`</p>
                </div>
                
                {dbStatus && (
                  <pre className="bg-[#F8F5F0] p-3 rounded-xl border border-black/[0.03] font-mono text-[9px] text-[#6B6B6B] overflow-x-auto max-h-24">
                    {JSON.stringify(dbStatus, null, 2)}
                  </pre>
                )}
              </div>

              <button
                onClick={checkDb}
                disabled={checkingDb}
                className="cursor-pointer w-full py-2 bg-[#F8F5F0] hover:bg-slate-50 border border-black/[0.04] text-[#2D5A5A] font-bold rounded-xl text-xs transition-colors"
              >
                {checkingDb ? "Đang kiểm tra..." : "Kiểm tra lại"}
              </button>
            </div>

            {/* Redis Card */}
            <div className="bg-white border border-black/[0.05] rounded-3xl p-6 flex flex-col justify-between gap-6 hover:shadow-lg transition-all duration-300">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-600/10 border border-cyan-600/15 flex items-center justify-center text-cyan-600 font-bold text-xs uppercase tracking-wider">
                    rds
                  </div>
                  {redisStatus?.connected ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#4A7C59]/10 text-[#4A7C59] border border-[#4A7C59]/15">
                      KẾT NỐI TỐT
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#B45309]/10 text-[#B45309] border border-[#B45309]/15">
                      CHƯA KẾT NỐI
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-[#2D5A5A] text-base">Redis Client (PING)</h4>
                  <p className="text-[10px] text-[#6B6B6B]">ioredis Connection: `/api/debug/redis`</p>
                </div>
                
                {redisStatus && (
                  <pre className="bg-[#F8F5F0] p-3 rounded-xl border border-black/[0.03] font-mono text-[9px] text-[#6B6B6B] overflow-x-auto max-h-24">
                    {JSON.stringify(redisStatus, null, 2)}
                  </pre>
                )}
              </div>

              <button
                onClick={checkRedis}
                disabled={checkingRedis}
                className="cursor-pointer w-full py-2 bg-[#F8F5F0] hover:bg-slate-50 border border-black/[0.04] text-[#2D5A5A] font-bold rounded-xl text-xs transition-colors"
              >
                {checkingRedis ? "Đang kiểm tra..." : "Kiểm tra lại"}
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Premium Footer */}
      <footer className="mt-24 border-t border-black/[0.06] pt-12 bg-white px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-[#6B6B6B]">
          <p>© 2026 Smart Travel Guide. Bản thiết kế & Scaffold Đồ án CNPM Tuần 1.</p>
          <div className="flex gap-6 font-semibold">
            <span>Sinh viên: Nguyễn Hoàng Phương</span>
            <span>Lớp: CN2303CLCA</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
