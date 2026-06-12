import tourismDestinations from '@/data/vietnam-tourism-destinations.json';

export type TourismDestination = {
  id: string;
  name: string;
  province: string;
  description: string;
  rating: string;
  image: string;
  keywords: string[];
};

export type TourismSearchPlace = {
  osmId: string;
  name: string;
  type: string;
  lat: number;
  lng: number;
  address: string;
  tags: string[];
};

const PROVINCE_CENTERS: Record<string, { lat: number; lng: number; label: string }> = {
  'an giang': { lat: 10.5216, lng: 105.1259, label: 'An Giang' },
  'ba ria vung tau': { lat: 10.5417, lng: 107.243, label: 'Bà Rịa - Vũng Tàu' },
  'bac giang': { lat: 21.2731, lng: 106.1946, label: 'Bắc Giang' },
  'bac kan': { lat: 22.147, lng: 105.8348, label: 'Bắc Kạn' },
  'bac lieu': { lat: 9.294, lng: 105.7278, label: 'Bạc Liêu' },
  'bac ninh': { lat: 21.1214, lng: 106.111, label: 'Bắc Ninh' },
  'ben tre': { lat: 10.1082, lng: 106.4406, label: 'Bến Tre' },
  'binh dinh': { lat: 14.1665, lng: 108.9027, label: 'Bình Định' },
  'binh duong': { lat: 11.3254, lng: 106.477, label: 'Bình Dương' },
  'binh phuoc': { lat: 11.7512, lng: 106.7235, label: 'Bình Phước' },
  'binh thuan': { lat: 11.0904, lng: 108.0721, label: 'Bình Thuận' },
  'ca mau': { lat: 9.1768, lng: 105.1524, label: 'Cà Mau' },
  'cao bang': { lat: 22.6666, lng: 106.2639, label: 'Cao Bằng' },
  'can tho': { lat: 10.0452, lng: 105.7469, label: 'Cần Thơ' },
  'da nang': { lat: 16.0471, lng: 108.2068, label: 'Đà Nẵng' },
  'dak lak': { lat: 12.7100, lng: 108.2378, label: 'Đắk Lắk' },
  'dak nong': { lat: 12.2646, lng: 107.6098, label: 'Đắk Nông' },
  'dien bien': { lat: 21.3860, lng: 103.0166, label: 'Điện Biên' },
  'dong nai': { lat: 11.0686, lng: 107.1676, label: 'Đồng Nai' },
  'dong thap': { lat: 10.4938, lng: 105.6882, label: 'Đồng Tháp' },
  'gia lai': { lat: 13.9833, lng: 108.0000, label: 'Gia Lai' },
  'ha giang': { lat: 22.8025, lng: 104.9784, label: 'Hà Giang' },
  'ha nam': { lat: 20.5835, lng: 105.9229, label: 'Hà Nam' },
  'ha noi': { lat: 21.0278, lng: 105.8342, label: 'Hà Nội' },
  'ha tinh': { lat: 18.3428, lng: 105.9057, label: 'Hà Tĩnh' },
  'hai duong': { lat: 20.9386, lng: 106.3146, label: 'Hải Dương' },
  'hai phong': { lat: 20.8449, lng: 106.6881, label: 'Hải Phòng' },
  'hau giang': { lat: 9.7845, lng: 105.4701, label: 'Hậu Giang' },
  'hoa binh': { lat: 20.6861, lng: 105.3131, label: 'Hòa Bình' },
  'hung yen': { lat: 20.8526, lng: 106.0169, label: 'Hưng Yên' },
  'khanh hoa': { lat: 12.2585, lng: 109.0526, label: 'Khánh Hòa' },
  'kien giang': { lat: 10.0125, lng: 105.0809, label: 'Kiên Giang' },
  'kon tum': { lat: 14.3497, lng: 108.0005, label: 'Kon Tum' },
  'lai chau': { lat: 22.3862, lng: 103.4703, label: 'Lai Châu' },
  'lam dong': { lat: 11.5753, lng: 108.1429, label: 'Lâm Đồng' },
  'lang son': { lat: 21.8537, lng: 106.7615, label: 'Lạng Sơn' },
  'lao cai': { lat: 22.4809, lng: 103.9755, label: 'Lào Cai' },
  'long an': { lat: 10.6956, lng: 106.2431, label: 'Long An' },
  'nam dinh': { lat: 20.4388, lng: 106.1621, label: 'Nam Định' },
  'nghe an': { lat: 19.2342, lng: 104.9200, label: 'Nghệ An' },
  'ninh binh': { lat: 20.2506, lng: 105.9744, label: 'Ninh Bình' },
  'ninh thuan': { lat: 11.6739, lng: 108.8629, label: 'Ninh Thuận' },
  'phu tho': { lat: 21.3200, lng: 105.2050, label: 'Phú Thọ' },
  'phu yen': { lat: 13.0882, lng: 109.0929, label: 'Phú Yên' },
  'quang binh': { lat: 17.6103, lng: 106.3487, label: 'Quảng Bình' },
  'quang nam': { lat: 15.5394, lng: 108.0191, label: 'Quảng Nam' },
  'quang ngai': { lat: 15.1214, lng: 108.8044, label: 'Quảng Ngãi' },
  'quang ninh': { lat: 21.0064, lng: 107.2925, label: 'Quảng Ninh' },
  'quang tri': { lat: 16.7500, lng: 107.1900, label: 'Quảng Trị' },
  'soc trang': { lat: 9.6037, lng: 105.9739, label: 'Sóc Trăng' },
  'son la': { lat: 21.3270, lng: 103.9141, label: 'Sơn La' },
  'tay ninh': { lat: 11.3351, lng: 106.1099, label: 'Tây Ninh' },
  'thai binh': { lat: 20.4463, lng: 106.3366, label: 'Thái Bình' },
  'thai nguyen': { lat: 21.5942, lng: 105.8482, label: 'Thái Nguyên' },
  'thanh hoa': { lat: 19.8067, lng: 105.7852, label: 'Thanh Hóa' },
  'thua thien hue': { lat: 16.4637, lng: 107.5909, label: 'Thừa Thiên Huế' },
  'tien giang': { lat: 10.4493, lng: 106.3421, label: 'Tiền Giang' },
  'tp ho chi minh': { lat: 10.7769, lng: 106.7009, label: 'TP. Hồ Chí Minh' },
  'tra vinh': { lat: 9.9347, lng: 106.3453, label: 'Trà Vinh' },
  'tuyen quang': { lat: 21.7767, lng: 105.2280, label: 'Tuyên Quang' },
  'vinh long': { lat: 10.2537, lng: 105.9722, label: 'Vĩnh Long' },
  'vinh phuc': { lat: 21.3609, lng: 105.5474, label: 'Vĩnh Phúc' },
  'yen bai': { lat: 21.7168, lng: 104.8986, label: 'Yên Bái' },
};

const PROVINCE_ALIASES: Record<string, string> = {
  hue: 'thua thien hue',
  'ho chi minh': 'tp ho chi minh',
  'thanh pho ho chi minh': 'tp ho chi minh',
  hcm: 'tp ho chi minh',
  tphcm: 'tp ho chi minh',
  'sai gon': 'tp ho chi minh',
  saigon: 'tp ho chi minh',
  'quang ninh': 'quang ninh',
};

export function normalizeTourismText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/\bviet nam\b/g, '')
    .replace(/\b(thanh pho|tp)\b\.?/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function provinceKey(value: string): string {
  const normalized = normalizeTourismText(value.split(',')[0] || value);
  return PROVINCE_ALIASES[normalized] || normalized;
}

export function provinceCenter(value: string) {
  const key = provinceKey(value);
  return PROVINCE_CENTERS[key] || { lat: 16.0471, lng: 108.2068, label: value };
}

function destinationToSearchPlace(destination: TourismDestination): TourismSearchPlace {
  const center = provinceCenter(destination.province);
  return {
    osmId: `curated:${destination.id}`,
    name: destination.name,
    type: destination.keywords[0] || 'du lịch',
    lat: center.lat,
    lng: center.lng,
    address: center.label,
    tags: destination.keywords.length > 0 ? destination.keywords : ['du lịch'],
  };
}

function provinceToSearchPlace(province: string): TourismSearchPlace {
  const center = provinceCenter(province);
  return {
    osmId: `curated:province:${provinceKey(province).replace(/\s+/g, '-')}`,
    name: center.label,
    type: 'province',
    lat: center.lat,
    lng: center.lng,
    address: `${center.label}, Việt Nam`,
    tags: ['province', 'du lịch'],
  };
}

export function getTourismDestinationsByRegion(region?: string): TourismDestination[] {
  if (!region) return [];

  const regionKey = provinceKey(region);
  return (tourismDestinations as TourismDestination[]).filter((item) => {
    const itemProvinceKey = provinceKey(item.province);
    return itemProvinceKey === regionKey || regionKey.includes(itemProvinceKey) || itemProvinceKey.includes(regionKey);
  });
}

export function searchTourismPlaces(query: string): TourismSearchPlace[] {
  const normalized = normalizeTourismText(query);
  if (!normalized) return [];

  const destinations = tourismDestinations as TourismDestination[];
  const provinceMatches = Array.from(new Set(
    destinations
      .map((item) => item.province)
      .filter((province) => {
        const key = provinceKey(province);
        return key === provinceKey(query) || normalized.includes(key);
      })
  )).map(provinceToSearchPlace);

  const destinationMatches = destinations
    .map((item) => {
      const name = normalizeTourismText(item.name);
      const province = normalizeTourismText(item.province);
      const keywords = item.keywords.map(normalizeTourismText);
      const description = normalizeTourismText(item.description);
      const isShortQuery = normalized.length <= 4;

      let score = 0;
      if (name === normalized) score += 100;
      if (keywords.some((keyword) => keyword === normalized)) score += 85;
      if (keywords.some((keyword) => keyword.includes(normalized))) score += 55;
      if (name.startsWith(normalized)) score += 60;
      if (!isShortQuery && name.includes(normalized)) score += 45;
      if (normalized.includes(name)) score += 45;
      if (province === normalized) score += 25;
      if (!isShortQuery && (province.includes(normalized) || normalized.includes(province))) score += 15;
      if (description.includes(normalized)) score += 5;

      return { item, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => destinationToSearchPlace(item));

  const seen = new Set<string>();
  return [...provinceMatches, ...destinationMatches]
    .filter((item) => {
      if (seen.has(item.osmId)) return false;
      seen.add(item.osmId);
      return true;
    })
    .slice(0, 12);
}
