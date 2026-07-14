import { normalizeVietnameseText } from '@/lib/string';
import type { TourismDestination } from '@/lib/vietnam-tourism';

export type DestinationEditorialItem = {
  title: string;
  description: string;
};

export type DestinationEditorialContent = {
  overviewTitle: string;
  overviewParagraphs: string[];
  experienceTitle: string;
  experienceItems: DestinationEditorialItem[];
  preparationItems: DestinationEditorialItem[];
  relatedTitle: string;
  relatedParagraph: string;
};

type DestinationProfile = 'coastal' | 'nature' | 'heritage' | 'general';

const COASTAL_SIGNALS = ['biển', 'bãi biển', 'vịnh', 'đảo', 'bờ biển'];
const NATURE_SIGNALS = ['núi', 'thác', 'rừng', 'suối', 'hang', 'đèo', 'vườn quốc gia', 'sinh thái', 'thám hiểm'];
const HERITAGE_SIGNALS = ['di tích', 'lịch sử', 'văn hóa', 'chùa', 'đền', 'nhà thờ', 'bảo tàng', 'tháp', 'làng cổ'];

function matchesSignals(destination: TourismDestination, signals: string[]): boolean {
  const values = [destination.name, ...destination.keywords].map(normalizeVietnameseText);
  return signals
    .map(normalizeVietnameseText)
    .some((signal) => values.some((value) => value === signal || value.includes(signal)));
}

function getDestinationProfile(destination: TourismDestination): DestinationProfile {
  if (matchesSignals(destination, COASTAL_SIGNALS)) return 'coastal';
  if (matchesSignals(destination, NATURE_SIGNALS)) return 'nature';
  if (matchesSignals(destination, HERITAGE_SIGNALS)) return 'heritage';
  return 'general';
}

function getExperienceItems(profile: DestinationProfile, destination: TourismDestination): DestinationEditorialItem[] {
  if (profile === 'coastal') {
    return [
      {
        title: 'Đọc điều kiện thời tiết trước khi đi',
        description: `Kiểm tra dự báo thời tiết, tình trạng biển và hướng dẫn an toàn tại ${destination.name} trước ngày khởi hành. Điều kiện thực tế có thể làm thay đổi thời điểm hoặc phạm vi tham quan.`,
      },
      {
        title: 'Giữ nhịp trải nghiệm vừa phải',
        description: 'Chừa thời gian nghỉ, bổ sung nước và bảo vệ cơ thể khi hoạt động ngoài trời. Một lịch trình có khoảng trống sẽ dễ điều chỉnh hơn khi thời tiết thay đổi.',
      },
      {
        title: 'Giữ gìn không gian ven biển',
        description: 'Tuân thủ khu vực được phép tiếp cận, không để lại rác và hạn chế tác động đến cảnh quan. Các chỉ dẫn tại chỗ luôn cần được ưu tiên.',
      },
    ];
  }

  if (profile === 'nature') {
    return [
      {
        title: 'Chủ động trước địa hình',
        description: `Kiểm tra tình trạng tuyến tiếp cận và hướng dẫn tại ${destination.name}. Nếu hành trình đi sâu vào khu vực tự nhiên, hãy chọn phương án phù hợp với thể lực của cả nhóm.`,
      },
      {
        title: 'Chừa khoảng trống cho thời tiết',
        description: 'Không xếp các chặng quá sát nhau. Khoảng thời gian dự phòng giúp bạn xử lý thay đổi về thời tiết, đường đi hoặc thời gian di chuyển mà không làm đảo lộn toàn bộ lịch trình.',
      },
      {
        title: 'Đi qua nhưng không để lại dấu vết',
        description: 'Đi đúng khu vực được hướng dẫn, mang rác trở ra và không tác động vào hệ sinh thái. Một chuyến đi có trách nhiệm giúp cảnh quan được giữ nguyên cho những hành trình sau.',
      },
    ];
  }

  if (profile === 'heritage') {
    return [
      {
        title: 'Tìm hiểu trước bối cảnh điểm đến',
        description: `Đọc thông tin giới thiệu và xác nhận giờ hoạt động của ${destination.name} trước khi ghé thăm. Bối cảnh lịch sử hoặc văn hóa sẽ giúp trải nghiệm tại chỗ có chiều sâu hơn.`,
      },
      {
        title: 'Tôn trọng không gian địa phương',
        description: 'Ưu tiên trang phục phù hợp, giữ âm lượng vừa phải và hỏi trước khi chụp ảnh tại khu vực có quy định riêng hoặc gắn với sinh hoạt cộng đồng.',
      },
      {
        title: 'Dành thời gian để quan sát',
        description: 'Không cần đi thật nhanh qua mọi hạng mục. Một nhịp tham quan chậm giúp bạn nhận ra câu chuyện, chi tiết kiến trúc và cách không gian được sử dụng trong đời sống hiện tại.',
      },
    ];
  }

  return [
    {
      title: 'Xác nhận thông tin hoạt động',
      description: `Kiểm tra giờ mở cửa, điều kiện tiếp cận và thông báo mới nhất của ${destination.name}. Thông tin thực tế có thể thay đổi theo thời điểm hoặc công tác vận hành tại chỗ.`,
    },
    {
      title: 'Dành đủ thời gian cho điểm dừng',
      description: 'Tránh xếp quá nhiều địa điểm trong cùng một buổi. Khoảng thời gian hợp lý giúp bạn tham quan thoải mái và vẫn có phương án khi việc di chuyển kéo dài hơn dự kiến.',
    },
    {
      title: 'Tôn trọng chỉ dẫn tại chỗ',
      description: 'Tuân thủ quy định, giữ vệ sinh và tôn trọng không gian sinh hoạt của cộng đồng địa phương. Đây là nền tảng cho một trải nghiệm văn minh và bền vững.',
    },
  ];
}

function getPreparationItems(profile: DestinationProfile): DestinationEditorialItem[] {
  const equipmentDescription = profile === 'nature'
    ? 'Ưu tiên giày có độ bám, trang phục linh hoạt, nước uống và vật dụng bảo vệ phù hợp với hoạt động ngoài trời.'
    : profile === 'coastal'
      ? 'Chuẩn bị nước uống, vật dụng chống nắng và trang phục phù hợp với điều kiện thời tiết tại thời điểm khởi hành.'
      : 'Chọn trang phục thoải mái, phù hợp với thời tiết và quy định riêng của điểm đến nếu có.';

  return [
    {
      title: 'Thông tin thực tế',
      description: 'Đối chiếu giờ hoạt động, tuyến tiếp cận và quy định tham quan từ đơn vị quản lý hoặc nguồn chính thức trước ngày đi.',
    },
    {
      title: 'Trang phục và vật dụng',
      description: equipmentDescription,
    },
    {
      title: 'Nhịp lịch trình',
      description: 'Giữ một khoảng thời gian dự phòng giữa các chặng để chủ động trước thời tiết, giao thông và thời gian tham quan thực tế.',
    },
  ];
}

function formatDestinationNames(destinations: TourismDestination[]): string {
  const names = destinations.map((destination) => destination.name);
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} và ${names[1]}`;
  return `${names.slice(0, -1).join(', ')} và ${names[names.length - 1]}`;
}

export function buildDestinationEditorialContent(
  destination: TourismDestination,
  relatedDestinations: TourismDestination[],
): DestinationEditorialContent {
  const profile = getDestinationProfile(destination);
  const relatedNames = formatDestinationNames(relatedDestinations);
  const relatedParagraph = relatedNames
    ? `Bạn có thể tiếp tục hành trình tại ${destination.province} với ${relatedNames}. Hãy sắp xếp thứ tự dựa trên vị trí thực tế, thời gian di chuyển và điều kiện hoạt động trong ngày.`
    : `Khi mở rộng hành trình tại ${destination.province}, hãy chọn các điểm dừng dựa trên vị trí thực tế, thời gian di chuyển và điều kiện hoạt động trong ngày.`;

  return {
    overviewTitle: `Khám phá ${destination.name} theo nhịp riêng`,
    overviewParagraphs: [
      `${destination.name} là một điểm dừng đáng cân nhắc khi xây dựng hành trình tại ${destination.province}. Thay vì ghé qua vội vàng, bạn có thể dành thời gian quan sát không gian, tìm hiểu bối cảnh địa phương và điều chỉnh nhịp tham quan theo điều kiện thực tế.`,
      'Tuyến tiếp cận, thời tiết, giờ hoạt động và quy định tại điểm đến có thể thay đổi. Việc kiểm tra nguồn chính thức trước ngày đi giúp lịch trình chủ động hơn và hạn chế những thay đổi vào phút cuối.',
    ],
    experienceTitle: 'Ba nhịp để chuyến ghé thăm trọn vẹn hơn',
    experienceItems: getExperienceItems(profile, destination),
    preparationItems: getPreparationItems(profile),
    relatedTitle: `Mở rộng hành trình tại ${destination.province}`,
    relatedParagraph,
  };
}
