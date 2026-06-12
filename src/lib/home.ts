export type HomeNewsCard = {
  category: string;
  title: string;
  date: string;
  views: string;
  image: string;
};

export const HOME_NEWS: HomeNewsCard[] = [
  {
    category: 'Chơi gì',
    title: 'Chiêm ngưỡng nét đẹp trầm mặc ở làng cổ Cự Đà - Nơi giao thoa văn hóa',
    date: '24/12/2025',
    views: '30',
    image: '/images/hanoi_temple.jpg',
  },
  {
    category: 'Đi đâu',
    title: 'Nhà thờ gỗ Kon Tum – Kiệt tác kiến trúc gỗ hơn 100 năm giữa lòng Tây Nguyên',
    date: '29/11/2025',
    views: '29',
    image: '/images/gialai.png',
  },
  {
    category: 'Đi đâu',
    title: 'Khám phá ATK Chợ Đồn: Vùng đất lịch sử giữa núi rừng Việt Bắc',
    date: '29/11/2025',
    views: '25',
    image: '/images/caobang_bangioc.jpg',
  },
  {
    category: 'Đi đâu',
    title: 'Đền An Mã – Nơi linh thiêng giữa lòng hồ Ba Bể',
    date: '29/11/2025',
    views: '18',
    image: '/images/hagiang.png',
  },
  {
    category: 'Đi đâu',
    title: 'Khám phá Tòa Giám Mục Kon Tum – Viên ngọc gỗ Tây Nguyên và diện mạo văn hóa',
    date: '29/11/2025',
    views: '21',
    image: '/images/daklak.png',
  },
  {
    category: 'Đi đâu',
    title: 'Nhà rông Kon K’lor – Biểu tượng văn hóa Ba Na giữa đại ngàn Tây Nguyên',
    date: '29/11/2025',
    views: '30',
    image: '/images/gialai.png',
  },
];

export const FEATURED_DESTINATIONS = [
  { title: 'Hội An', image: '/images/hoian.png', description: 'Phố cổ, ẩm thực và nhịp sống chậm ven sông.' },
  { title: 'Hạ Long', image: '/images/halongbay.png', description: 'Vịnh biển, hang động và lịch trình nghỉ dưỡng.' },
  { title: 'Huế', image: '/images/hue.jpg', description: 'Di sản cố đô, sông Hương và văn hóa miền Trung.' },
  { title: 'Hà Giang', image: '/images/hagiang.png', description: 'Cung đường núi, bản làng và cảnh quan rộng mở.' },
] as const;
