export interface TravelReference {
  title: string;
  description: string;
  image: string;
  sourceLocation: string;
  region: string;
  tips: readonly string[];
}

export const TRAVEL_REFERENCES = {
  'hoi-an-short-trip': {
    title: 'Kinh nghiệm lên lịch trình ngắn ngày',
    description: 'Gợi ý cách chọn điểm dừng, thời gian di chuyển và hoạt động phù hợp tại Hội An.',
    image: '/images/hoian.png',
    sourceLocation: 'Hội An',
    region: 'Quảng Nam',
    tips: ['Ưu tiên các điểm gần nhau trong khu phố cổ.', 'Dành buổi tối để trải nghiệm sông Hoài và phố đèn lồng.'],
  },
  'ha-giang-attractions': {
    title: 'Những điểm tham quan nên lưu lại',
    description: 'Danh sách địa điểm nổi bật để ưu tiên trong lần đầu khám phá Hà Giang.',
    image: '/images/hagiang.png',
    sourceLocation: 'Hà Giang',
    region: 'Hà Giang',
    tips: ['Giữ thời gian dự phòng cho các cung đường đèo.', 'Kiểm tra thời tiết trước khi di chuyển giữa các huyện vùng cao.'],
  },
  'ha-long-best-time': {
    title: 'Thời điểm phù hợp để du lịch',
    description: 'Các gợi ý theo mùa, thời tiết và nhịp hoạt động tại Hạ Long.',
    image: '/images/halongbay.png',
    sourceLocation: 'Hạ Long',
    region: 'Quảng Ninh',
    tips: ['Ưu tiên ngày trời quang nếu có kế hoạch đi vịnh.', 'Đặt dịch vụ sớm trong mùa hè và các kỳ nghỉ lễ.'],
  },
  'hue-local-food': {
    title: 'Ẩm thực và trải nghiệm bản địa',
    description: 'Các món nên thử và khu vực có nhiều trải nghiệm đời sống địa phương tại Huế.',
    image: '/images/hue.jpg',
    sourceLocation: 'Huế',
    region: 'Thừa Thiên Huế',
    tips: ['Kết hợp điểm tham quan với chợ và khu ẩm thực gần đó.', 'Ưu tiên quán có thông tin giá và đánh giá gần đây.'],
  },
  'cu-da-cultural-village': {
    title: 'Chiêm ngưỡng nét đẹp trầm mặc ở làng cổ Cự Đà - Nơi giao thoa văn hóa',
    description: 'Danh sách địa điểm văn hóa và lịch sử có thể kết hợp khi khám phá Hà Nội.',
    image: '/images/hanoi_temple.jpg',
    sourceLocation: 'Làng cổ Cự Đà',
    region: 'Hà Nội',
    tips: ['Tôn trọng không gian sinh hoạt của cư dân địa phương.', 'Kết hợp các điểm ngoại thành theo cùng một hướng di chuyển.'],
  },
  'kon-tum-wooden-church': {
    title: 'Nhà thờ gỗ Kon Tum – Kiệt tác kiến trúc gỗ hơn 100 năm giữa lòng Tây Nguyên',
    description: 'Các địa điểm kiến trúc, văn hóa và thiên nhiên đáng tham khảo tại Kon Tum.',
    image: '/images/gialai.png',
    sourceLocation: 'Nhà thờ gỗ Kon Tum',
    region: 'Kon Tum',
    tips: ['Giữ trang phục phù hợp khi tham quan công trình tôn giáo.', 'Kết hợp các điểm văn hóa trong trung tâm thành phố.'],
  },
  'cho-don-historical-area': {
    title: 'Khám phá ATK Chợ Đồn: Vùng đất lịch sử giữa núi rừng Việt Bắc',
    description: 'Các điểm lịch sử và thiên nhiên có thể kết hợp trong hành trình Bắc Kạn.',
    image: '/images/caobang_bangioc.jpg',
    sourceLocation: 'ATK Chợ Đồn',
    region: 'Bắc Kạn',
    tips: ['Ưu tiên phương tiện phù hợp với đường miền núi.', 'Dành đủ thời gian cho các điểm di tích nằm xa nhau.'],
  },
  'ba-be-an-ma-temple': {
    title: 'Đền An Mã – Nơi linh thiêng giữa lòng hồ Ba Bể',
    description: 'Danh sách điểm tham khảo quanh hồ Ba Bể và các khu vực lân cận.',
    image: '/images/hagiang.png',
    sourceLocation: 'Hồ Ba Bể',
    region: 'Bắc Kạn',
    tips: ['Theo dõi thời tiết trước các hoạt động trên hồ.', 'Giữ gìn cảnh quan và tuân thủ hướng dẫn tại điểm tâm linh.'],
  },
  'kon-tum-bishop-house': {
    title: 'Khám phá Tòa Giám Mục Kon Tum – Viên ngọc gỗ Tây Nguyên và diện mạo văn hóa',
    description: 'Gợi ý các điểm kiến trúc và văn hóa đặc sắc trong hành trình Kon Tum.',
    image: '/images/daklak.png',
    sourceLocation: 'Tòa Giám Mục Kon Tum',
    region: 'Kon Tum',
    tips: ['Kiểm tra giờ mở cửa trước khi đến.', 'Kết hợp với bảo tàng và làng văn hóa gần trung tâm.'],
  },
  'kon-klor-communal-house': {
    title: 'Nhà rông Kon K’lor – Biểu tượng văn hóa Ba Na giữa đại ngàn Tây Nguyên',
    description: 'Các điểm tham khảo giúp tìm hiểu văn hóa bản địa và cảnh quan Kon Tum.',
    image: '/images/gialai.png',
    sourceLocation: 'Nhà rông Kon K’lor',
    region: 'Kon Tum',
    tips: ['Tôn trọng quy định của cộng đồng tại nhà rông.', 'Hỏi trước khi chụp ảnh người dân và hoạt động văn hóa.'],
  },
} as const satisfies Record<string, TravelReference>;

export type TravelReferenceSlug = keyof typeof TRAVEL_REFERENCES;

export const TRAVEL_REFERENCE_SLUGS = Object.keys(TRAVEL_REFERENCES) as TravelReferenceSlug[];
