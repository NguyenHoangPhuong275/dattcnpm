export interface Airline {
  code: string;
  name: string;
  type: 'Full Service' | 'Low Cost' | 'Hybrid';
  rating: number;
  reviewsCount: number;
  logoUrl: string;
  description: string;
  amenities: string[];
}

export interface Airport {
  code: string;
  name: string;
  city: string;
  region: 'Miền Bắc' | 'Miền Trung' | 'Tây Nguyên' | 'Miền Nam';
}

export interface FlightSchedule {
  id: string;
  flightNumber: string;
  from: string;
  to: string;
  airline: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  basePrice: number;
}

export const VIETNAM_AIRLINES: Airline[] = [
  {
    code: 'VN',
    name: 'Vietnam Airlines',
    type: 'Full Service',
    rating: 4.6,
    reviewsCount: 15420,
    logoUrl: '/images/airlines/vietnam-airlines.svg',
    description: 'Hãng hàng không quốc gia Việt Nam đạt tiêu chuẩn 4 sao quốc tế, dịch vụ chuyên nghiệp, chu đáo.',
    amenities: ['Hành lý ký gửi 23kg', 'Suất ăn nóng (chặng > 2h)', 'Nước uống & khăn lạnh', 'Màn hình giải trí riêng (dòng máy bay thân rộng)'],
  },
  {
    code: 'VJ',
    name: 'VietJet Air',
    type: 'Low Cost',
    rating: 3.2,
    reviewsCount: 28410,
    logoUrl: '/images/airlines/vietjet.svg',
    description: 'Hãng hàng không thế hệ mới, cung cấp các chuyến bay giá rẻ, nhiều khung giờ lựa chọn.',
    amenities: ['Hành lý xách tay 7kg', 'Giá vé tiết kiệm', 'Mua thêm suất ăn nóng trên khoang cabin'],
  },
  {
    code: 'QH',
    name: 'Bamboo Airways',
    type: 'Hybrid',
    rating: 4.2,
    reviewsCount: 9530,
    logoUrl: '/images/airlines/bamboo.svg',
    description: 'Hãng hàng không định hướng dịch vụ chất lượng cao, thân thiện, hiếu khách và đúng giờ.',
    amenities: ['Hành lý ký gửi 20kg', 'Nước uống & suất ăn nhẹ miễn phí', 'Không gian ghế ngồi rộng rãi'],
  },
  {
    code: 'VU',
    name: 'Vietravel Airlines',
    type: 'Hybrid',
    rating: 3.8,
    reviewsCount: 1450,
    logoUrl: '/images/airlines/vietravel.svg',
    description: 'Hãng hàng không trẻ gắn liền với hệ sinh thái du lịch trọn gói của Vietravel.',
    amenities: ['Hành lý xách tay 7kg', 'Nước uống & đồ ăn nhẹ miễn phí', 'Giới thiệu điểm đến du lịch trên chuyến bay'],
  },
];

export const VIETNAM_AIRPORTS: Airport[] = [
  { code: 'SGN', name: 'Sân bay quốc tế Tân Sơn Nhất', city: 'Hồ Chí Minh', region: 'Miền Nam' },
  { code: 'HAN', name: 'Sân bay quốc tế Nội Bài', city: 'Hà Nội', region: 'Miền Bắc' },
  { code: 'DAD', name: 'Sân bay quốc tế Đà Nẵng', city: 'Đà Nẵng', region: 'Miền Trung' },
  { code: 'CXR', name: 'Sân bay quốc tế Cam Ranh', city: 'Nha Trang', region: 'Miền Trung' },
  { code: 'PQC', name: 'Sân bay quốc tế Phú Quốc', city: 'Phú Quốc', region: 'Miền Nam' },
  { code: 'DLI', name: 'Sân bay quốc tế Liên Khương', city: 'Đà Lạt', region: 'Tây Nguyên' },
  { code: 'HUI', name: 'Sân bay quốc tế Phú Bài', city: 'Huế', region: 'Miền Trung' },
  { code: 'HPH', name: 'Sân bay quốc tế Cát Bi', city: 'Hải Phòng', region: 'Miền Bắc' },
  { code: 'VII', name: 'Sân bay quốc tế Vinh', city: 'Vinh', region: 'Miền Trung' },
  { code: 'UIH', name: 'Sân bay Phù Cát', city: 'Quy Nhơn', region: 'Miền Trung' },
  { code: 'VCA', name: 'Sân bay quốc tế Cần Thơ', city: 'Cần Thơ', region: 'Miền Nam' },
];

export const VIETNAM_FLIGHTS_SCHEDULE: FlightSchedule[] = [
  { id: 'FL-SGN-HAN-01', flightNumber: 'VN 204', from: 'SGN', to: 'HAN', airline: 'VN', departureTime: '06:00', arrivalTime: '08:15', duration: '2h 15m', basePrice: 1890000 },
  { id: 'FL-SGN-HAN-02', flightNumber: 'VJ 120', from: 'SGN', to: 'HAN', airline: 'VJ', departureTime: '06:30', arrivalTime: '08:45', duration: '2h 15m', basePrice: 1150000 },
  { id: 'FL-SGN-HAN-03', flightNumber: 'QH 202', from: 'SGN', to: 'HAN', airline: 'QH', departureTime: '07:15', arrivalTime: '09:30', duration: '2h 15m', basePrice: 1450000 },
  { id: 'FL-SGN-HAN-04', flightNumber: 'VN 216', from: 'SGN', to: 'HAN', airline: 'VN', departureTime: '08:00', arrivalTime: '10:15', duration: '2h 15m', basePrice: 2200000 },
  { id: 'FL-SGN-HAN-05', flightNumber: 'VU 780', from: 'SGN', to: 'HAN', airline: 'VU', departureTime: '08:45', arrivalTime: '11:00', duration: '2h 15m', basePrice: 1290000 },
  { id: 'FL-SGN-HAN-06', flightNumber: 'VJ 128', from: 'SGN', to: 'HAN', airline: 'VJ', departureTime: '09:30', arrivalTime: '11:45', duration: '2h 15m', basePrice: 990000 },
  { id: 'FL-SGN-HAN-07', flightNumber: 'QH 208', from: 'SGN', to: 'HAN', airline: 'QH', departureTime: '10:45', arrivalTime: '13:00', duration: '2h 15m', basePrice: 1550000 },
  { id: 'FL-SGN-HAN-08', flightNumber: 'VN 240', from: 'SGN', to: 'HAN', airline: 'VN', departureTime: '13:00', arrivalTime: '15:15', duration: '2h 15m', basePrice: 1950000 },
  { id: 'FL-SGN-HAN-09', flightNumber: 'VJ 142', from: 'SGN', to: 'HAN', airline: 'VJ', departureTime: '14:45', arrivalTime: '17:00', duration: '2h 15m', basePrice: 1100000 },
  { id: 'FL-SGN-HAN-10', flightNumber: 'VN 262', from: 'SGN', to: 'HAN', airline: 'VN', departureTime: '17:00', arrivalTime: '19:15', duration: '2h 15m', basePrice: 2450000 },
  { id: 'FL-SGN-HAN-11', flightNumber: 'QH 216', from: 'SGN', to: 'HAN', airline: 'QH', departureTime: '18:15', arrivalTime: '20:30', duration: '2h 15m', basePrice: 1650000 },
  { id: 'FL-SGN-HAN-12', flightNumber: 'VJ 156', from: 'SGN', to: 'HAN', airline: 'VJ', departureTime: '21:30', arrivalTime: '23:45', duration: '2h 15m', basePrice: 890000 },

  { id: 'FL-HAN-SGN-01', flightNumber: 'VN 205', from: 'HAN', to: 'SGN', airline: 'VN', departureTime: '06:00', arrivalTime: '08:15', duration: '2h 15m', basePrice: 1890000 },
  { id: 'FL-HAN-SGN-02', flightNumber: 'VJ 121', from: 'HAN', to: 'SGN', airline: 'VJ', departureTime: '06:45', arrivalTime: '09:00', duration: '2h 15m', basePrice: 1150000 },
  { id: 'FL-HAN-SGN-03', flightNumber: 'QH 201', from: 'HAN', to: 'SGN', airline: 'QH', departureTime: '07:30', arrivalTime: '09:45', duration: '2h 15m', basePrice: 1450000 },
  { id: 'FL-HAN-SGN-04', flightNumber: 'VN 221', from: 'HAN', to: 'SGN', airline: 'VN', departureTime: '09:00', arrivalTime: '11:15', duration: '2h 15m', basePrice: 2200000 },
  { id: 'FL-HAN-SGN-05', flightNumber: 'VJ 125', from: 'HAN', to: 'SGN', airline: 'VJ', departureTime: '11:30', arrivalTime: '13:45', duration: '2h 15m', basePrice: 1050000 },
  { id: 'FL-HAN-SGN-06', flightNumber: 'QH 207', from: 'HAN', to: 'SGN', airline: 'QH', departureTime: '13:15', arrivalTime: '15:30', duration: '2h 15m', basePrice: 1550000 },
  { id: 'FL-HAN-SGN-07', flightNumber: 'VN 243', from: 'HAN', to: 'SGN', airline: 'VN', departureTime: '14:30', arrivalTime: '16:45', duration: '2h 15m', basePrice: 1950000 },
  { id: 'FL-HAN-SGN-08', flightNumber: 'VU 781', from: 'HAN', to: 'SGN', airline: 'VU', departureTime: '16:20', arrivalTime: '18:35', duration: '2h 15m', basePrice: 1290000 },
  { id: 'FL-HAN-SGN-09', flightNumber: 'VJ 139', from: 'HAN', to: 'SGN', airline: 'VJ', departureTime: '18:00', arrivalTime: '20:15', duration: '2h 15m', basePrice: 1200000 },
  { id: 'FL-HAN-SGN-10', flightNumber: 'VN 265', from: 'HAN', to: 'SGN', airline: 'VN', departureTime: '19:00', arrivalTime: '21:15', duration: '2h 15m', basePrice: 2350000 },

  { id: 'FL-SGN-DAD-01', flightNumber: 'VN 116', from: 'SGN', to: 'DAD', airline: 'VN', departureTime: '06:15', arrivalTime: '07:35', duration: '1h 20m', basePrice: 1350000 },
  { id: 'FL-SGN-DAD-02', flightNumber: 'VJ 622', from: 'SGN', to: 'DAD', airline: 'VJ', departureTime: '07:05', arrivalTime: '08:25', duration: '1h 20m', basePrice: 820000 },
  { id: 'FL-SGN-DAD-03', flightNumber: 'QH 152', from: 'SGN', to: 'DAD', airline: 'QH', departureTime: '09:20', arrivalTime: '10:40', duration: '1h 20m', basePrice: 1090000 },
  { id: 'FL-SGN-DAD-04', flightNumber: 'VN 128', from: 'SGN', to: 'DAD', airline: 'VN', departureTime: '11:45', arrivalTime: '13:05', duration: '1h 20m', basePrice: 1500000 },
  { id: 'FL-SGN-DAD-05', flightNumber: 'VJ 628', from: 'SGN', to: 'DAD', airline: 'VJ', departureTime: '14:10', arrivalTime: '15:30', duration: '1h 20m', basePrice: 750000 },
  { id: 'FL-SGN-DAD-06', flightNumber: 'VU 224', from: 'SGN', to: 'DAD', airline: 'VU', departureTime: '16:00', arrivalTime: '17:20', duration: '1h 20m', basePrice: 950000 },
  { id: 'FL-SGN-DAD-07', flightNumber: 'VN 140', from: 'SGN', to: 'DAD', airline: 'VN', departureTime: '18:10', arrivalTime: '19:30', duration: '1h 20m', basePrice: 1650000 },

  { id: 'FL-DAD-SGN-01', flightNumber: 'VN 117', from: 'DAD', to: 'SGN', airline: 'VN', departureTime: '08:15', arrivalTime: '09:35', duration: '1h 20m', basePrice: 1350000 },
  { id: 'FL-DAD-SGN-02', flightNumber: 'VJ 623', from: 'DAD', to: 'SGN', airline: 'VJ', departureTime: '09:05', arrivalTime: '10:25', duration: '1h 20m', basePrice: 820000 },
  { id: 'FL-DAD-SGN-03', flightNumber: 'QH 153', from: 'DAD', to: 'SGN', airline: 'QH', departureTime: '11:20', arrivalTime: '12:40', duration: '1h 20m', basePrice: 1090000 },
  { id: 'FL-DAD-SGN-04', flightNumber: 'VN 129', from: 'DAD', to: 'SGN', airline: 'VN', departureTime: '13:45', arrivalTime: '15:05', duration: '1h 20m', basePrice: 1500000 },
  { id: 'FL-DAD-SGN-05', flightNumber: 'VJ 629', from: 'DAD', to: 'SGN', airline: 'VJ', departureTime: '16:10', arrivalTime: '17:30', duration: '1h 20m', basePrice: 750000 },

  { id: 'FL-HAN-DAD-01', flightNumber: 'VN 163', from: 'HAN', to: 'DAD', airline: 'VN', departureTime: '07:00', arrivalTime: '08:20', duration: '1h 20m', basePrice: 1400000 },
  { id: 'FL-HAN-DAD-02', flightNumber: 'VJ 507', from: 'HAN', to: 'DAD', airline: 'VJ', departureTime: '08:15', arrivalTime: '09:35', duration: '1h 20m', basePrice: 850000 },
  { id: 'FL-HAN-DAD-03', flightNumber: 'QH 112', from: 'HAN', to: 'DAD', airline: 'QH', departureTime: '11:00', arrivalTime: '12:20', duration: '1h 20m', basePrice: 1150000 },
  { id: 'FL-HAN-DAD-04', flightNumber: 'VN 171', from: 'HAN', to: 'DAD', airline: 'VN', departureTime: '13:30', arrivalTime: '14:50', duration: '1h 20m', basePrice: 1650000 },
  { id: 'FL-HAN-DAD-05', flightNumber: 'VJ 515', from: 'HAN', to: 'DAD', airline: 'VJ', departureTime: '16:30', arrivalTime: '17:50', duration: '1h 20m', basePrice: 790000 },

  { id: 'FL-DAD-HAN-01', flightNumber: 'VN 164', from: 'DAD', to: 'HAN', airline: 'VN', departureTime: '09:00', arrivalTime: '10:20', duration: '1h 20m', basePrice: 1400000 },
  { id: 'FL-DAD-HAN-02', flightNumber: 'VJ 508', from: 'DAD', to: 'HAN', airline: 'VJ', departureTime: '10:15', arrivalTime: '11:35', duration: '1h 20m', basePrice: 850000 },
  { id: 'FL-DAD-HAN-03', flightNumber: 'QH 113', from: 'DAD', to: 'HAN', airline: 'QH', departureTime: '13:00', arrivalTime: '14:20', duration: '1h 20m', basePrice: 1150000 },
  { id: 'FL-DAD-HAN-04', flightNumber: 'VN 172', from: 'DAD', to: 'HAN', airline: 'VN', departureTime: '15:30', arrivalTime: '16:50', duration: '1h 20m', basePrice: 1650000 },

  { id: 'FL-SGN-PQC-01', flightNumber: 'VN 1823', from: 'SGN', to: 'PQC', airline: 'VN', departureTime: '06:00', arrivalTime: '07:05', duration: '1h 05m', basePrice: 1250000 },
  { id: 'FL-SGN-PQC-02', flightNumber: 'VJ 321', from: 'SGN', to: 'PQC', airline: 'VJ', departureTime: '07:45', arrivalTime: '08:50', duration: '1h 05m', basePrice: 650000 },
  { id: 'FL-SGN-PQC-03', flightNumber: 'QH 1521', from: 'SGN', to: 'PQC', airline: 'QH', departureTime: '10:30', arrivalTime: '11:35', duration: '1h 05m', basePrice: 950000 },
  { id: 'FL-SGN-PQC-04', flightNumber: 'VU 340', from: 'SGN', to: 'PQC', airline: 'VU', departureTime: '13:15', arrivalTime: '14:20', duration: '1h 05m', basePrice: 790000 },
  { id: 'FL-SGN-PQC-05', flightNumber: 'VN 1827', from: 'SGN', to: 'PQC', airline: 'VN', departureTime: '15:20', arrivalTime: '16:25', duration: '1h 05m', basePrice: 1550000 },

  { id: 'FL-PQC-SGN-01', flightNumber: 'VN 1824', from: 'PQC', to: 'SGN', airline: 'VN', departureTime: '08:00', arrivalTime: '09:05', duration: '1h 05m', basePrice: 1250000 },
  { id: 'FL-PQC-SGN-02', flightNumber: 'VJ 322', from: 'PQC', to: 'SGN', airline: 'VJ', departureTime: '09:45', arrivalTime: '10:50', duration: '1h 05m', basePrice: 650000 },
  { id: 'FL-PQC-SGN-03', flightNumber: 'QH 1522', from: 'PQC', to: 'SGN', airline: 'QH', departureTime: '12:30', arrivalTime: '13:35', duration: '1h 05m', basePrice: 950000 },

  { id: 'FL-SGN-CXR-01', flightNumber: 'VN 1354', from: 'SGN', to: 'CXR', airline: 'VN', departureTime: '06:10', arrivalTime: '07:15', duration: '1h 05m', basePrice: 1190000 },
  { id: 'FL-SGN-CXR-02', flightNumber: 'VJ 602', from: 'SGN', to: 'CXR', airline: 'VJ', departureTime: '08:20', arrivalTime: '09:25', duration: '1h 05m', basePrice: 590000 },
  { id: 'FL-SGN-CXR-03', flightNumber: 'VN 1358', from: 'SGN', to: 'CXR', airline: 'VN', departureTime: '11:30', arrivalTime: '12:35', duration: '1h 05m', basePrice: 1390000 },
  { id: 'FL-SGN-CXR-04', flightNumber: 'QH 1402', from: 'SGN', to: 'CXR', airline: 'QH', departureTime: '14:15', arrivalTime: '15:20', duration: '1h 05m', basePrice: 850000 },

  { id: 'FL-HAN-CXR-01', flightNumber: 'VN 1557', from: 'HAN', to: 'CXR', airline: 'VN', departureTime: '07:10', arrivalTime: '09:05', duration: '1h 55m', basePrice: 1750000 },
  { id: 'FL-HAN-CXR-02', flightNumber: 'VJ 771', from: 'HAN', to: 'CXR', airline: 'VJ', departureTime: '09:40', arrivalTime: '11:35', duration: '1h 55m', basePrice: 1100000 },
  { id: 'FL-HAN-CXR-03', flightNumber: 'QH 1411', from: 'HAN', to: 'CXR', airline: 'QH', departureTime: '12:35', arrivalTime: '14:30', duration: '1h 55m', basePrice: 1450000 },
];

export function getAirlineByCode(code: string): Airline | null {
  const normalized = code.trim().toUpperCase();
  return VIETNAM_AIRLINES.find((airline) => airline.code === normalized) ?? null;
}

export function getAirportByCode(code: string): Airport | null {
  const normalized = code.trim().toUpperCase();
  return VIETNAM_AIRPORTS.find((airport) => airport.code === normalized) ?? null;
}

export function getFlightScheduleById(id: string): FlightSchedule | null {
  return VIETNAM_FLIGHTS_SCHEDULE.find((flight) => flight.id === id) ?? null;
}
