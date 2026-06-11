export const REGIONS = [
  'Đồng Bằng Sông Hồng',
  'Đông Bắc Bộ',
  'Bắc Trung Bộ',
  'Tây Bắc Bộ',
  'Nam Trung Bộ',
  'Tây Nguyên',
  'Đông Nam Bộ',
  'Đồng Bằng Sông Cửu Long',
] as const;

export type RegionName = (typeof REGIONS)[number];

export const DEFAULT_REGION: RegionName = 'Bắc Trung Bộ';

export interface GuideSection {
  title: string;
  paragraphs: string[];
}

export interface StoryCard {
  title: string;
  description: string;
  image: string;
}

export interface Locality {
  slug: string;
  name: string;
  region: RegionName;
  image: string;
  summary: string;
  description: string;
  guideSections?: GuideSection[];
}

export const LOCALITIES: Locality[] = [
  {
    slug: 'ha-noi',
    name: 'Hà Nội',
    region: 'Đồng Bằng Sông Hồng',
    image: '/images/hanoi_temple.jpg',
    summary: 'Thủ đô nghìn năm với di sản, ẩm thực và nhịp sống đô thị đặc trưng.',
    description: 'Hà Nội là điểm đến kết hợp giữa phố cổ, hồ nước, kiến trúc Pháp và đời sống văn hóa lâu đời. Du khách có thể khám phá di tích, ẩm thực đường phố và khởi đầu hành trình đến nhiều tỉnh phía Bắc.',
  },
  {
    slug: 'bac-ninh',
    name: 'Bắc Ninh',
    region: 'Đồng Bằng Sông Hồng',
    image: '/images/bacninh_quanho.jpg',
    summary: 'Vùng đất quan họ, làng nghề và các di tích văn hóa Bắc Bộ.',
    description: 'Bắc Ninh nổi bật với dân ca quan họ, đình chùa cổ và hệ thống làng nghề truyền thống. Đây là lựa chọn phù hợp cho hành trình ngắn ngày tìm hiểu văn hóa đồng bằng Bắc Bộ.',
  },
  {
    slug: 'hung-yen',
    name: 'Hưng Yên',
    region: 'Đồng Bằng Sông Hồng',
    image: '/images/hungyen_xichdang.jpg',
    summary: 'Không gian Phố Hiến, nhãn lồng và hệ thống di tích ven sông.',
    description: 'Hưng Yên lưu giữ dấu ấn thương cảng xưa qua Phố Hiến, đền chùa và các làng cổ. Điểm đến phù hợp với du khách thích lịch sử, văn hóa và nhịp đi chậm.',
  },
  {
    slug: 'ninh-binh',
    name: 'Ninh Bình',
    region: 'Đồng Bằng Sông Hồng',
    image: '/images/ninhbinh.png',
    summary: 'Cảnh quan núi đá vôi, sông nước và quần thể di sản nổi bật.',
    description: 'Ninh Bình hấp dẫn với Tràng An, Tam Cốc, Hang Múa và cố đô Hoa Lư. Không gian thiên nhiên rộng mở giúp địa phương này phù hợp cho cả nghỉ dưỡng lẫn khám phá.',
  },
  {
    slug: 'hai-phong',
    name: 'Hải Phòng',
    region: 'Đồng Bằng Sông Hồng',
    image: '/images/haiphong_doson.jpg',
    summary: 'Thành phố cảng với Cát Bà, Đồ Sơn và ẩm thực đường phố nổi bật.',
    description: 'Hải Phòng có lợi thế biển đảo, cảng biển và văn hóa ẩm thực rõ nét. Du khách thường kết hợp khám phá trung tâm thành phố với Cát Bà, Lan Hạ hoặc các điểm nghỉ dưỡng ven biển.',
  },
  {
    slug: 'phu-tho',
    name: 'Phú Thọ',
    region: 'Đông Bắc Bộ',
    image: '/images/phutho.png',
    summary: 'Vùng đất Tổ với di tích lịch sử, lễ hội truyền thống và không gian trung du đặc trưng.',
    description: 'Phú Thọ gắn với Đền Hùng, tín ngưỡng thờ cúng Hùng Vương và nhiều điểm du lịch văn hóa vùng trung du. Đây là địa phương phù hợp cho hành trình tìm hiểu lịch sử, lễ hội và các tuyến nghỉ ngắn ngày gần Hà Nội.',
  },
  {
    slug: 'thai-nguyen',
    name: 'Thái Nguyên',
    region: 'Đông Bắc Bộ',
    image: '/images/thainguyen.png',
    summary: 'Vùng chè nổi tiếng với hồ, đồi trung du và các điểm trải nghiệm văn hóa bản địa.',
    description: 'Thái Nguyên có hồ Núi Cốc, đồi chè Tân Cương, bảo tàng văn hóa các dân tộc Việt Nam và nhiều tuyến sinh thái gần trung tâm. Địa phương này phù hợp với lịch trình ngắn, kết hợp tham quan, nghỉ ngơi và trải nghiệm đặc sản chè.',
  },
  {
    slug: 'quang-ninh',
    name: 'Quảng Ninh',
    region: 'Đông Bắc Bộ',
    image: '/images/halongbay.png',
    summary: 'Vùng biển đảo nổi tiếng với vịnh Hạ Long và nhiều tuyến nghỉ dưỡng.',
    description: 'Quảng Ninh là cửa ngõ du lịch biển phía Bắc với vịnh Hạ Long, Yên Tử, Cô Tô và Móng Cái. Đây là lựa chọn phù hợp cho lịch trình biển đảo, tâm linh và nghỉ dưỡng.',
  },
  {
    slug: 'cao-bang',
    name: 'Cao Bằng',
    region: 'Đông Bắc Bộ',
    image: '/images/caobang_bangioc.jpg',
    summary: 'Vùng núi biên giới với thác nước, hang động và cảnh quan cao nguyên.',
    description: 'Cao Bằng nổi bật với thác Bản Giốc, động Ngườm Ngao và những cung đường vùng cao giàu cảnh quan. Đây là lựa chọn phù hợp cho hành trình thiên nhiên và khám phá.',
  },
  {
    slug: 'lang-son',
    name: 'Lạng Sơn',
    region: 'Đông Bắc Bộ',
    image: '/images/langson.png',
    summary: 'Vùng biên giới Đông Bắc với chợ cửa khẩu, núi non và các di tích lịch sử.',
    description: 'Lạng Sơn có núi Tô Thị, động Tam Thanh, chợ Đông Kinh, cửa khẩu Hữu Nghị và nhiều điểm văn hóa vùng biên. Đây là địa phương phù hợp cho hành trình kết hợp mua sắm, lịch sử và cảnh quan miền núi.',
  },
  {
    slug: 'tuyen-quang',
    name: 'Tuyên Quang',
    region: 'Đông Bắc Bộ',
    image: '/images/tuyenquang.png',
    summary: 'Không gian trung du miền núi với di tích cách mạng, hồ sinh thái và bản sắc địa phương.',
    description: 'Tuyên Quang nổi bật với khu di tích Tân Trào, hồ Na Hang, thác Mơ và các tuyến trải nghiệm thiên nhiên. Địa phương này phù hợp cho du lịch lịch sử, sinh thái và các chuyến đi yên tĩnh hơn.',
  },
  {
    slug: 'thanh-hoa',
    name: 'Thanh Hóa',
    region: 'Bắc Trung Bộ',
    image: '/images/thanhhoa_samson.jpg',
    summary: 'Điểm đến đa dạng với biển, di sản và các khu sinh thái miền Trung.',
    description: 'Thanh Hóa có Sầm Sơn, Pù Luông, thành nhà Hồ và nhiều điểm du lịch tự nhiên. Địa phương này phù hợp cho cả nghỉ biển, trekking nhẹ và trải nghiệm văn hóa.',
    guideSections: [
      {
        title: 'Giới thiệu chung',
        paragraphs: [
          'Thanh Hóa là vùng đất có sự kết hợp rõ giữa biển, di sản và sinh thái. Từ Sầm Sơn đến Pù Luông, du khách có nhiều lựa chọn cho một hành trình dài ngày hoặc ngắn ngày.',
          'Địa phương này thường được lựa chọn nhờ tuyến di chuyển thuận, hệ sinh thái dịch vụ đa dạng và nhiều điểm tham quan phù hợp với gia đình lẫn nhóm bạn.',
        ],
      },
      {
        title: 'Địa điểm tham quan',
        paragraphs: [
          'Sầm Sơn là điểm biển quen thuộc nhất, còn Pù Luông phù hợp cho nghỉ dưỡng giữa thiên nhiên. Thành nhà Hồ, Hòn Trống Mái và các khu sinh thái cũng là các điểm đáng chú ý.',
          'Nếu muốn tránh mật độ đông, nên đi vào ngày thường hoặc chọn các điểm ít thương mại hóa hơn để giữ trải nghiệm thoáng và dễ chịu hơn.',
        ],
      },
    ],
  },
  {
    slug: 'nghe-an',
    name: 'Nghệ An',
    region: 'Bắc Trung Bộ',
    image: '/images/nghean_cualo.jpg',
    summary: 'Vùng đất lịch sử, biển Cửa Lò và các không gian sinh thái rộng lớn.',
    description: 'Nghệ An kết hợp du lịch biển, di tích lịch sử và cảnh quan miền núi phía Tây. Du khách có thể trải nghiệm Cửa Lò, quê Bác, các bản làng và vườn quốc gia.',
  },
  {
    slug: 'ha-tinh',
    name: 'Hà Tĩnh',
    region: 'Bắc Trung Bộ',
    image: '/images/hatinh_thiencam.webp',
    summary: 'Địa phương ven biển với núi Hồng, biển Thiên Cầm và văn hóa miền Trung.',
    description: 'Hà Tĩnh có biển Thiên Cầm, chùa Hương Tích, hồ Kẻ Gỗ và nhiều tuyến du lịch sinh thái. Không gian còn giữ nét yên tĩnh, phù hợp với lịch trình nghỉ ngơi.',
  },
  {
    slug: 'quang-tri',
    name: 'Quảng Trị',
    region: 'Bắc Trung Bộ',
    image: '/images/quangtri_hienluong.webp',
    summary: 'Vùng đất lịch sử với nhiều di tích chiến trường và bờ biển miền Trung.',
    description: 'Quảng Trị gắn với thành cổ, cầu Hiền Lương, địa đạo Vịnh Mốc và đảo Cồn Cỏ. Đây là địa phương phù hợp cho du lịch lịch sử, ký ức và trải nghiệm biển đảo.',
  },
  {
    slug: 'hue',
    name: 'Huế',
    region: 'Bắc Trung Bộ',
    image: '/images/hue.jpg',
    summary: 'Cố đô với di sản triều Nguyễn, sông Hương và nhịp sống trầm mặc.',
    description: 'Huế nổi bật với Đại Nội, lăng tẩm, chùa Thiên Mụ, ẩm thực cung đình và các tuyến trải nghiệm ven sông Hương. Đây là địa phương giàu chiều sâu văn hóa, phù hợp cho hành trình khám phá di sản.',
  },
  {
    slug: 'son-la',
    name: 'Sơn La',
    region: 'Tây Bắc Bộ',
    image: '/images/sonla.png',
    summary: 'Vùng cao Tây Bắc với cao nguyên, bản làng và cảnh quan núi rừng rộng mở.',
    description: 'Sơn La có Mộc Châu, Tà Xùa, thủy điện Sơn La và nhiều bản làng mang nét văn hóa Tây Bắc. Đây là địa phương phù hợp cho săn mây, nghỉ dưỡng cao nguyên, trải nghiệm nông trại và khám phá đời sống bản địa.',
  },
  {
    slug: 'lao-cai',
    name: 'Lào Cai',
    region: 'Tây Bắc Bộ',
    image: '/images/laocai.png',
    summary: 'Cửa ngõ Tây Bắc với Sa Pa, ruộng bậc thang, núi cao và văn hóa vùng biên.',
    description: 'Lào Cai nổi bật với Sa Pa, Fansipan, Y Tý, Bắc Hà và các phiên chợ vùng cao. Địa phương này phù hợp cho hành trình nghỉ dưỡng, trekking nhẹ, ngắm cảnh núi và tìm hiểu văn hóa các dân tộc miền núi.',
  },
  {
    slug: 'lai-chau',
    name: 'Lai Châu',
    region: 'Tây Bắc Bộ',
    image: '/images/laichau.png',
    summary: 'Không gian núi cao Tây Bắc với đèo, thác, hang động và bản làng yên tĩnh.',
    description: 'Lai Châu có đèo Ô Quy Hồ, cao nguyên Sìn Hồ, Pu Ta Leng và nhiều điểm thiên nhiên còn giữ nét hoang sơ. Đây là lựa chọn phù hợp cho người thích hành trình ít đông, cảnh quan rộng và trải nghiệm vùng cao.',
  },
  {
    slug: 'dien-bien',
    name: 'Điện Biên',
    region: 'Tây Bắc Bộ',
    image: '/images/dienbien.png',
    summary: 'Vùng đất lịch sử Tây Bắc với lòng chảo Điện Biên, di tích chiến trường và bản sắc dân tộc.',
    description: 'Điện Biên gắn với chiến thắng Điện Biên Phủ, các di tích lịch sử, đèo Pha Đin và không gian văn hóa Thái, Mông. Địa phương này phù hợp cho hành trình lịch sử, khám phá vùng biên và trải nghiệm nhịp sống Tây Bắc.',
  },
  {
    slug: 'da-nang',
    name: 'Đà Nẵng',
    region: 'Nam Trung Bộ',
    image: '/images/danang.png',
    summary: 'Thành phố biển hiện đại với hạ tầng du lịch mạnh và nhiều trải nghiệm đô thị.',
    description: 'Đà Nẵng là trung tâm du lịch miền Trung với bãi biển dài, Bà Nà Hills, cầu Rồng và nhiều tuyến kết nối thuận tiện. Địa phương này phù hợp cho cả nghỉ dưỡng lẫn khám phá thành phố.',
  },
  {
    slug: 'quang-ngai',
    name: 'Quảng Ngãi',
    region: 'Nam Trung Bộ',
    image: '/images/quangngai.png',
    summary: 'Vùng duyên hải miền Trung với đảo Lý Sơn, biển xanh và dấu ấn văn hóa Sa Huỳnh.',
    description: 'Quảng Ngãi có đảo Lý Sơn, biển Mỹ Khê, khu chứng tích Sơn Mỹ và nhiều điểm tham quan ven biển. Địa phương này phù hợp cho hành trình biển đảo, lịch sử và khám phá ẩm thực miền Trung.',
  },
  {
    slug: 'khanh-hoa',
    name: 'Khánh Hòa',
    region: 'Nam Trung Bộ',
    image: '/images/nhatrang.png',
    summary: 'Tỉnh ven biển với vịnh đẹp, đảo và hệ sinh thái du lịch biển đảo phong phú.',
    description: 'Khánh Hòa có Nha Trang, Cam Ranh, Vân Phong và nhiều tuyến du lịch biển đảo đặc trưng. Đây là vùng phù hợp cho nghỉ dưỡng, tắm biển và trải nghiệm dịch vụ ven biển.',
  },
  {
    slug: 'gia-lai',
    name: 'Gia Lai',
    region: 'Tây Nguyên',
    image: '/images/gialai.png',
    summary: 'Cao nguyên rộng với hồ, thác và không gian văn hóa bản địa đặc trưng.',
    description: 'Gia Lai nổi bật với Biển Hồ, núi lửa Chư Đăng Ya, thác Phú Cường và văn hóa cồng chiêng. Đây là điểm đến phù hợp cho hành trình khám phá cao nguyên Tây Nguyên.',
  },
  {
    slug: 'dak-lak',
    name: 'Đắk Lắk',
    region: 'Tây Nguyên',
    image: '/images/daklak.png',
    summary: 'Trung tâm cà phê và văn hóa bản địa với nhiều điểm đến sinh thái.',
    description: 'Đắk Lắk có Buôn Ma Thuột, hồ Lắk, thác Dray Nur và nhiều không gian văn hóa Ê Đê. Địa phương này phù hợp cho du lịch sinh thái, trải nghiệm bản địa và ẩm thực cao nguyên.',
  },
  {
    slug: 'lam-dong',
    name: 'Lâm Đồng',
    region: 'Tây Nguyên',
    image: '/images/dalat.png',
    summary: 'Không gian cao nguyên mát mẻ với nhiều điểm nghỉ dưỡng và nông trại.',
    description: 'Lâm Đồng có Đà Lạt, Bảo Lộc và nhiều điểm tham quan sinh thái, nông nghiệp và nghỉ dưỡng. Đây là lựa chọn phù hợp cho các chuyến đi dài ngày lẫn cuối tuần.',
  },
  {
    slug: 'tay-ninh',
    name: 'Tây Ninh',
    region: 'Đông Nam Bộ',
    image: '/images/tayninh.png',
    summary: 'Vùng biên với núi, hồ và các điểm du lịch tâm linh nổi bật.',
    description: 'Tây Ninh có núi Bà Đen, hồ Dầu Tiếng, Tòa thánh Cao Đài và nhiều tuyến trải nghiệm gần Sài Gòn. Đây là lựa chọn phù hợp cho du lịch tâm linh, trekking nhẹ và cuối tuần.',
  },
  {
    slug: 'dong-nai',
    name: 'Đồng Nai',
    region: 'Đông Nam Bộ',
    image: '/images/dongnai.png',
    summary: 'Cửa ngõ phía Đông của TP. Hồ Chí Minh với nhiều điểm sinh thái và nghỉ dưỡng.',
    description: 'Đồng Nai có Vườn quốc gia Cát Tiên, hồ Trị An, thác Giang Điền và nhiều khu nghỉ dưỡng gần đô thị. Địa phương này phù hợp cho các chuyến đi ngắn, kết hợp thiên nhiên và thư giãn.',
  },
  {
    slug: 'tp-ho-chi-minh',
    name: 'Hồ Chí Minh',
    region: 'Đông Nam Bộ',
    image: '/images/tphcm.png',
    summary: 'Đô thị năng động, trung tâm văn hóa, mua sắm và ẩm thực phía Nam.',
    description: 'TP. Hồ Chí Minh là điểm khởi hành quan trọng cho nhiều hành trình phía Nam. Thành phố có bảo tàng, công trình kiến trúc, chợ truyền thống, khu mua sắm và đời sống đêm sôi động.',
  },
  {
    slug: 'can-tho',
    name: 'Cần Thơ',
    region: 'Đồng Bằng Sông Cửu Long',
    image: '/images/cantho.png',
    summary: 'Trung tâm miền Tây với chợ nổi, miệt vườn và văn hóa sông nước.',
    description: 'Cần Thơ nổi bật với chợ nổi Cái Răng, bến Ninh Kiều, vườn trái cây và các tuyến tham quan kênh rạch. Đây là điểm đến tiêu biểu cho trải nghiệm đồng bằng sông Cửu Long.',
  },
  {
    slug: 'an-giang',
    name: 'An Giang',
    region: 'Đồng Bằng Sông Cửu Long',
    image: '/images/angiang.png',
    summary: 'Vùng núi giữa miền Tây với rừng tràm, chợ nổi và văn hóa đa sắc.',
    description: 'An Giang có núi Sam, rừng tràm Trà Sư, Châu Đốc và nhiều điểm du lịch tâm linh. Địa phương này phù hợp cho hành trình khám phá thiên nhiên và văn hóa miền biên giới.',
  },
  {
    slug: 'dong-thap',
    name: 'Đồng Tháp',
    region: 'Đồng Bằng Sông Cửu Long',
    image: '/images/dongthap.png',
    summary: 'Vùng đất sen hồng với sinh thái ngập nước và không gian miệt vườn.',
    description: 'Đồng Tháp nổi bật với Tràm Chim, làng hoa Sa Đéc, Gò Tháp và nhiều điểm du lịch sinh thái. Đây là địa phương phù hợp cho hành trình nhẹ nhàng, gần gũi thiên nhiên miền Tây.',
  },
  {
    slug: 'vinh-long',
    name: 'Vĩnh Long',
    region: 'Đồng Bằng Sông Cửu Long',
    image: '/images/vinhlong.png',
    summary: 'Xứ cù lao giữa sông với chợ nổi, vườn trái cây và nhịp sống sông nước.',
    description: 'Vĩnh Long có nhiều cù lao, vườn cây ăn trái và tuyến du lịch sông nước đặc trưng. Địa phương này phù hợp cho trải nghiệm miệt vườn, homestay và du lịch cộng đồng.',
  },
  {
    slug: 'ca-mau',
    name: 'Cà Mau',
    region: 'Đồng Bằng Sông Cửu Long',
    image: '/images/camau.png',
    summary: 'Cực Nam Tổ quốc với rừng ngập mặn, mũi đất và văn hóa sông nước.',
    description: 'Cà Mau có Mũi Cà Mau, rừng U Minh Hạ, chợ nổi và nhiều trải nghiệm sinh thái đặc sắc. Đây là điểm đến phù hợp cho hành trình khám phá cực Nam và thiên nhiên vùng đất cuối trời.',
  },
];

export function getLocalityBySlug(slug: string) {
  return LOCALITIES.find((locality) => locality.slug === slug);
}

export function getLocalitiesByRegion(region: RegionName) {
  return LOCALITIES.filter((locality) => locality.region === region);
}

export function searchLocalities(region: RegionName, query: string) {
  const normalizedQuery = normalizeLocalityQuery(query);
  const regionalLocalities = getLocalitiesByRegion(region);

  if (!normalizedQuery) {
    return regionalLocalities;
  }

  return regionalLocalities.filter((locality) => {
    return normalizeLocalityQuery(locality.name).includes(normalizedQuery);
  });
}

export function getLocalityGuideSections(locality: Locality): GuideSection[] {
  if (locality.guideSections) {
    return locality.guideSections;
  }

  const name = locality.name;
  const region = locality.region.toLocaleLowerCase('vi-VN');

  return [
    {
      title: 'Giới thiệu chung',
      paragraphs: [
        `${name} là một địa phương thuộc vùng ${region}, phù hợp cho những chuyến đi kết hợp giữa tham quan, trải nghiệm văn hóa và nghỉ ngơi. Khi lên lịch trình, du khách nên xác định trước nhóm trải nghiệm chính để tránh di chuyển quá dày và bỏ lỡ các điểm có giá trị thực sự.`,
        `Điểm mạnh của ${name} nằm ở khả năng kết nối với các địa phương lân cận, nhờ đó có thể xây dựng hành trình ngắn ngày hoặc mở rộng thành chuyến đi nhiều chặng. Nên ưu tiên các tuyến có thời gian di chuyển rõ ràng, điểm dừng hợp lý và dịch vụ lưu trú ổn định.`,
      ],
    },
    {
      title: `Thời gian thích hợp để du lịch ${name}`,
      paragraphs: [
        `Thời điểm phù hợp để đến ${name} phụ thuộc vào loại hình trải nghiệm bạn chọn. Nếu ưu tiên tham quan ngoài trời, nên tránh các giai đoạn mưa lớn hoặc cao điểm lễ tết vì chi phí dịch vụ thường tăng và các điểm nổi bật dễ quá tải.`,
        `Với lịch trình gia đình hoặc nhóm đông, nên đặt phòng và phương tiện trước, đồng thời giữ một khoảng thời gian dự phòng trong ngày. Cách này giúp chuyến đi ổn định hơn khi thời tiết thay đổi hoặc tuyến tham quan phát sinh đông khách.`,
      ],
    },
    {
      title: `Địa điểm tham quan tại ${name}`,
      paragraphs: [
        `${name} có thể được khai thác theo nhiều hướng: tham quan văn hóa, khám phá thiên nhiên, nghỉ dưỡng hoặc trải nghiệm ẩm thực địa phương. Nên chọn một khu vực trung tâm làm điểm neo, sau đó mở rộng sang các điểm gần nhau để giảm thời gian di chuyển.`,
        `Khi đi vào cuối tuần, nên xuất phát sớm và tránh dồn quá nhiều điểm nổi tiếng trong cùng một ngày. Các điểm ít đông hơn thường cho trải nghiệm tốt hơn, đặc biệt nếu bạn muốn chụp ảnh, tìm hiểu câu chuyện địa phương hoặc đi cùng trẻ nhỏ.`,
      ],
    },
    {
      title: `Đặc sản ${name}`,
      paragraphs: [
        `Ẩm thực tại ${name} nên được trải nghiệm qua các quán có lượng khách địa phương ổn định thay vì chỉ chọn hàng quán quanh điểm du lịch. Điều này giúp giảm rủi ro về giá cả, chất lượng nguyên liệu và các món bị điều chỉnh quá nhiều theo khẩu vị khách vãng lai.`,
        `Nếu mua đặc sản làm quà, nên kiểm tra hạn sử dụng, nguồn gốc và cách bảo quản. Với các món theo mùa, chất lượng thường chênh lệch rõ giữa thời điểm chính vụ và trái vụ.`,
      ],
    },
    {
      title: `Lưu trú tại ${name}`,
      paragraphs: [
        `Lưu trú tại ${name} nên được chọn theo vị trí của lịch trình, không chỉ theo giá phòng. Ở gần trung tâm giúp thuận tiện ăn uống và di chuyển, trong khi các khu nghỉ xa hơn phù hợp nếu mục tiêu chính là nghỉ dưỡng hoặc trải nghiệm thiên nhiên.`,
        `Trước khi đặt phòng, nên kiểm tra đánh giá gần đây, chính sách hủy và khoảng cách thực tế đến các điểm muốn tham quan. Đây là các yếu tố ảnh hưởng trực tiếp đến chất lượng chuyến đi, nhất là vào mùa cao điểm.`,
      ],
    },
  ];
}

export const LOCALITY_NEWS: StoryCard[] = [
  {
    title: 'Kinh nghiệm lên lịch trình ngắn ngày',
    description: 'Gợi ý cách chọn điểm dừng, thời gian di chuyển và hoạt động phù hợp.',
    image: '/images/hoian.png',
  },
  {
    title: 'Những điểm tham quan nên lưu lại',
    description: 'Danh sách địa điểm nổi bật để ưu tiên trong lần đầu khám phá.',
    image: '/images/hagiang.png',
  },
  {
    title: 'Thời điểm phù hợp để du lịch',
    description: 'Các gợi ý theo mùa, thời tiết và nhịp hoạt động địa phương.',
    image: '/images/halongbay.png',
  },
  {
    title: 'Ẩm thực và trải nghiệm bản địa',
    description: 'Các món nên thử và khu vực có nhiều trải nghiệm đời sống địa phương.',
    image: '/images/hue.jpg',
  },
];

export const LOCALITY_DISCOVERY: StoryCard[] = [
  {
    title: 'Lịch trình văn hóa',
    description: 'Tập trung vào di tích, bảo tàng, phố cổ và các câu chuyện địa phương.',
    image: '/images/hue.jpg',
  },
  {
    title: 'Lịch trình thiên nhiên',
    description: 'Ưu tiên cảnh quan mở, sông nước, núi rừng và điểm ngắm cảnh.',
    image: '/images/hagiang.png',
  },
  {
    title: 'Lịch trình nghỉ dưỡng',
    description: 'Gợi ý nhịp đi chậm, điểm ăn uống và thời gian nghỉ hợp lý.',
    image: '/images/halongbay.png',
  },
];

function normalizeLocalityQuery(value: string) {
  return value.trim().toLocaleLowerCase('vi-VN');
}
