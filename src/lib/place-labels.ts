const PLACE_TYPE_LABELS: Record<string, string> = {
  attraction: 'Điểm tham quan',
  museum: 'Bảo tàng',
  viewpoint: 'Điểm ngắm cảnh',
  artwork: 'Tác phẩm nghệ thuật',
  gallery: 'Phòng trưng bày',
  theme_park: 'Khu vui chơi',
  zoo: 'Sở thú',
  monument: 'Tượng đài',
  memorial: 'Khu tưởng niệm',
  castle: 'Thành cổ',
  ruins: 'Di tích',
  archaeological_site: 'Khu khảo cổ',
  place_of_worship: 'Cơ sở tôn giáo',
  historic: 'Di tích lịch sử',
  tourism: 'Điểm du lịch',
  park: 'Công viên',
  nature_reserve: 'Khu bảo tồn thiên nhiên',
  garden: 'Khu vườn',
  beach_resort: 'Khu nghỉ dưỡng biển',
  picnic_site: 'Khu dã ngoại',
  province: 'Tỉnh, thành phố',
  beach: 'Bãi biển',
  city: 'Thành phố',
  nature: 'Thiên nhiên',
  resort: 'Khu nghỉ dưỡng',
  heritage: 'Di sản',
  culture: 'Văn hóa',
  mountain: 'Miền núi',
  island: 'Đảo',
  river: 'Sông nước',
  food: 'Ẩm thực',
};

export function getPlaceTypeLabel(value: string): string {
  const type = value.trim();
  if (!type) return 'Địa điểm';

  const label = PLACE_TYPE_LABELS[type.toLowerCase()];
  if (label) return label;

  return /^[a-z0-9_:-]+$/i.test(type) ? 'Địa điểm' : type;
}
