
export type ChecklistTemplateId =
  | 'mountain'
  | 'beach'
  | 'abroad'
  | 'business'
  | 'resort';

export interface ChecklistTemplate {
  id: ChecklistTemplateId;
  name: string;
  description: string;
  icon: string;
  items: string[];
}

export const CHECKLIST_TEMPLATES: ChecklistTemplate[] = [
  {
    id: 'mountain',
    name: 'Leo núi / Trekking',
    description: 'Đồ dùng và lưu ý an toàn cho chuyến leo núi, dã ngoại đường dài.',
    icon: '🏔️',
    items: [
      'Giày leo núi chống trượt',
      'Ba lô trekking + áo mưa che ba lô',
      'Đèn pin/đèn đội đầu + pin dự phòng',
      'Bình nước và viên lọc nước',
      'Lương khô, đồ ăn nhẹ giàu năng lượng',
      'Bộ sơ cứu y tế cá nhân',
      'Áo giữ nhiệt, áo khoác gió',
      'Bản đồ/định vị GPS, la bàn',
      'Kem chống nắng và thuốc chống côn trùng',
      'Gậy trekking',
      'Kiểm tra dự báo thời tiết trước khi đi',
      'Thông báo lịch trình cho người thân',
    ],
  },
  {
    id: 'beach',
    name: 'Đi biển',
    description: 'Chuẩn bị cho chuyến đi biển, tắm nắng và hoạt động dưới nước.',
    icon: '🏖️',
    items: [
      'Đồ bơi và đồ thay',
      'Kem chống nắng chỉ số cao',
      'Kính râm và mũ rộng vành',
      'Khăn tắm biển',
      'Dép xỏ ngón',
      'Túi chống nước cho điện thoại',
      'Thuốc chống say sóng (nếu đi tàu/cano)',
      'Nước uống và đồ ăn nhẹ',
      'Phao bơi/đồ lặn ngắm san hô',
      'Thuốc hạ sốt, gel bôi sau nắng',
    ],
  },
  {
    id: 'abroad',
    name: 'Đi nước ngoài',
    description: 'Thủ tục giấy tờ và đồ dùng cần thiết khi du lịch quốc tế.',
    icon: '🌍',
    items: [
      'Hộ chiếu còn hạn trên 6 tháng',
      'Visa/giấy phép nhập cảnh (nếu cần)',
      'Vé máy bay khứ hồi (bản in + điện tử)',
      'Bảo hiểm du lịch quốc tế',
      'Đổi ngoại tệ / thẻ thanh toán quốc tế',
      'Ổ cắm chuyển đổi điện đa năng',
      'Bản sao giấy tờ tùy thân (lưu riêng)',
      'SIM quốc tế / eSIM hoặc roaming',
      'Thuốc cá nhân kèm đơn thuốc tiếng Anh',
      'Đặt trước khách sạn và lịch trình',
      'Lưu địa chỉ đại sứ quán Việt Nam',
      'Kiểm tra quy định hành lý của hãng bay',
    ],
  },
  {
    id: 'business',
    name: 'Công tác',
    description: 'Chuẩn bị cho chuyến công tác, họp hành và làm việc.',
    icon: '💼',
    items: [
      'Laptop và sạc',
      'Tài liệu/hợp đồng cần thiết',
      'Danh thiếp (name card)',
      'Trang phục công sở',
      'Sạc dự phòng và dây cáp',
      'Lịch họp và thông tin liên hệ đối tác',
      'Giấy tờ công tác / quyết định cử đi',
      'Hóa đơn để quyết toán chi phí',
      'Bút và sổ ghi chú',
      'Xác nhận đặt phòng và phương tiện di chuyển',
    ],
  },
  {
    id: 'resort',
    name: 'Nghỉ dưỡng',
    description: 'Chuyến nghỉ dưỡng thư giãn tại resort, spa.',
    icon: '🌴',
    items: [
      'Trang phục thoải mái và đồ bơi',
      'Kem chống nắng và đồ chăm sóc da',
      'Sách / thiết bị giải trí',
      'Đồ dùng vệ sinh cá nhân',
      'Máy ảnh và sạc',
      'Xác nhận đặt phòng resort',
      'Thẻ thành viên / voucher ưu đãi (nếu có)',
      'Thuốc cá nhân cơ bản',
      'Trang phục dự tiệc/ăn tối (nếu cần)',
    ],
  },
];

export function getChecklistTemplate(id: string): ChecklistTemplate | undefined {
  return CHECKLIST_TEMPLATES.find((template) => template.id === id);
}

export const CHECKLIST_TEMPLATE_IDS: ChecklistTemplateId[] = CHECKLIST_TEMPLATES.map((t) => t.id);
