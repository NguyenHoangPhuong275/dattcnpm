export type HomeDestination = {
  slug: string;
  tags: Array<'Traveling' | 'Staying' | 'Eating' | 'Amusing'>;
};

export type HomeNewsCard = {
  category: string;
  title: string;
  date: string;
  views: string;
  image: string;
};

export type HomeExperienceCard = {
  localitySlug: string;
  title: string;
  address: string;
  score: string;
  status: string;
};

export type HomeVideoCard = {
  category: string;
  title: string;
  date: string;
  views: string;
  image: string;
};

export const HERO_IMAGE = '/images/halongbay.png';

export const TOP_DESTINATIONS: HomeDestination[] = [
  { slug: 'an-giang', tags: ['Traveling', 'Staying', 'Eating', 'Amusing'] },
  { slug: 'bac-ninh', tags: ['Traveling', 'Staying', 'Eating', 'Amusing'] },
  { slug: 'cao-bang', tags: ['Traveling', 'Staying', 'Eating', 'Amusing'] },
  { slug: 'ca-mau', tags: ['Traveling', 'Staying', 'Eating', 'Amusing'] },
  { slug: 'can-tho', tags: ['Traveling', 'Staying', 'Eating', 'Amusing'] },
  { slug: 'gia-lai', tags: ['Traveling', 'Staying', 'Eating', 'Amusing'] },
];

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

export const HOME_EXPERIENCES: HomeExperienceCard[] = [
  {
    localitySlug: 'hung-yen',
    title: 'Bảo tàng Thái Bình',
    address: 'Đường Lý Thường Kiệt, thành phố Thái Bình, tỉnh Thái Bình',
    score: '6.5',
    status: 'Hài lòng (4)',
  },
  {
    localitySlug: 'nghe-an',
    title: 'Đình Hoành Sơn',
    address: 'Xã Khánh Sơn, huyện Nam Đàn, tỉnh Nghệ An',
    score: '10',
    status: 'Tuyệt vời',
  },
  {
    localitySlug: 'ha-noi',
    title: 'Lăng Chủ tịch Hồ Chí Minh',
    address: 'Số 2, Hùng Vương, Điện Biên, quận Ba Đình, thành phố Hà Nội',
    score: '10',
    status: 'Tuyệt vời (1)',
  },
  {
    localitySlug: 'ha-noi',
    title: 'Chùa Một Cột',
    address: 'Phố Đội Cấn, quận Ba Đình, thành phố Hà Nội',
    score: '10',
    status: 'Tuyệt vời (1)',
  },
];

export const HOME_VIDEOS: HomeVideoCard[] = [
  {
    category: 'Chơi gì',
    title: 'Khám phá địa điểm chill cuối tuần tại Sóc Sơn',
    date: '10/10/2025',
    views: '117',
    image: '/images/hanoi.png',
  },
  {
    category: 'Ăn gì',
    title: '24H Ăn Chill ở Cửa Lò thì có gì?',
    date: '10/10/2025',
    views: '50',
    image: '/images/nghean_cualo.jpg',
  },
  {
    category: 'Ăn gì',
    title: 'Tiệm ốc ngon - bổ - rẻ giữa lòng Sài Gòn',
    date: '10/10/2025',
    views: '48',
    image: '/images/tphcm.png',
  },
  {
    category: 'Ở đâu',
    title: 'Lịch trình Ninh Bình 2n1đ mùa đẹp nhất trong năm',
    date: '10/10/2025',
    views: '139',
    image: '/images/ninhbinh.png',
  },
];
