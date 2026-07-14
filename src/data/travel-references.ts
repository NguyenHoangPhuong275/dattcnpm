export interface TravelReference {
  title: string;
  description: string;
  image: string;
  sourceLocation: string;
  region: string;
  category: string;
  publishedAt: string;
  sections: readonly { heading: string; paragraphs: readonly string[] }[];
  tips: readonly string[];
}

export const TRAVEL_REFERENCES = {
  'hoi-an-short-trip': {
    title: 'Kinh nghiệm lên lịch trình ngắn ngày',
    description: 'Gợi ý cách chọn điểm dừng, thời gian di chuyển và hoạt động phù hợp tại Hội An.',
    image: '/images/hoian.png',
    sourceLocation: 'Hội An',
    region: 'Quảng Nam',
    category: 'Đi đâu',
    publishedAt: '2025-10-18',
    sections: [
      {
        heading: 'Vì sao Hội An hợp với chuyến đi ngắn ngày',
        paragraphs: [
          'Phố cổ Hội An gói gọn trong vài trăm mét vuông ven sông Hoài, gần như mọi điểm tham quan chính đều nằm trong khoảng cách đi bộ 5–10 phút. Chính sự cô đọng đó khiến Hội An trở thành điểm đến lý tưởng cho những kỳ nghỉ chỉ có một đến hai ngày: bạn không mất thời gian di chuyển, và mỗi khung giờ trong ngày lại cho phố cổ một gương mặt khác.',
          'Khác với những điểm đến cần lịch trình dày đặc, Hội An thưởng cho người đi chậm. Một buổi chiều ngồi cà phê gác hai nhìn xuống mái ngói rêu phong có thể đáng giá hơn việc cố ghé đủ mọi di tích.',
        ],
      },
      {
        heading: 'Gợi ý nhịp một ngày trong phố cổ',
        paragraphs: [
          'Buổi sáng, hãy bắt đầu từ Chùa Cầu khi đường phố còn vắng, sau đó lần lượt ghé nhà cổ Tấn Ký, hội quán Phúc Kiến — các điểm này dùng chung một loại vé tham quan phố cổ nên bạn chỉ cần mua một lần. Buổi trưa nắng gắt là lúc hợp lý để nghỉ và thưởng thức cao lầu hoặc cơm gà.',
          'Từ cuối chiều, phố cổ chuyển nhịp: đèn lồng thắp dần, sông Hoài đông thuyền và chợ đêm Nguyễn Hoàng bắt đầu nhộn nhịp. Đây là khung giờ đẹp nhất để dạo bộ dọc bờ sông và chụp ảnh.',
        ],
      },
      {
        heading: 'Mẹo giữ lịch trình nhẹ nhàng',
        paragraphs: [
          'Nếu chỉ có một đêm, hãy ưu tiên ngủ trong hoặc sát phố cổ để tận dụng buổi sớm và buổi tối — hai khung giờ Hội An đẹp nhất mà khách đi tour trong ngày thường bỏ lỡ. Cuối tuần và dịp rằm nên đặt chỗ ăn tối trước, vì các quán trung tâm kín chỗ rất sớm.',
        ],
      },
    ],
    tips: ['Ưu tiên các điểm gần nhau trong khu phố cổ.', 'Dành buổi tối để trải nghiệm sông Hoài và phố đèn lồng.'],
  },
  'ha-giang-attractions': {
    title: 'Những điểm tham quan nên lưu lại',
    description: 'Danh sách địa điểm nổi bật để ưu tiên trong lần đầu khám phá Hà Giang.',
    image: '/images/hagiang.png',
    sourceLocation: 'Hà Giang',
    region: 'Hà Giang',
    category: 'Đi đâu',
    publishedAt: '2025-10-25',
    sections: [
      {
        heading: 'Cung đường và những điểm dừng đáng giá',
        paragraphs: [
          'Hành trình Hà Giang kinh điển men theo quốc lộ 4C qua bốn huyện cao nguyên đá: cổng trời Quản Bạ với núi đôi nổi tiếng, những rặng thông Yên Minh, phố cổ Đồng Văn, rồi lên đèo Mã Pì Lèng — nơi dòng Nho Quế xanh ngắt uốn dưới vực sâu. Mỗi chặng đều xứng đáng một điểm dừng thay vì chỉ lướt qua.',
          'Nếu còn thời gian, cột cờ Lũng Cú và dinh thự họ Vương ở Sà Phìn là hai điểm giúp hiểu thêm lịch sử vùng biên viễn này.',
        ],
      },
      {
        heading: 'Thời gian và nhịp di chuyển',
        paragraphs: [
          'Đường đèo Hà Giang đẹp nhưng chậm: quãng đường 150 km trên bản đồ có thể mất trọn một ngày nếu tính cả các điểm dừng ngắm cảnh. Lịch trình 3–4 ngày từ thành phố Hà Giang là mức hợp lý để không phải chạy đua với trời tối, và luôn nên chừa dự phòng cho sương mù hoặc mưa bất chợt.',
        ],
      },
      {
        heading: 'Lưu ý văn hóa bản địa',
        paragraphs: [
          'Cao nguyên đá là nơi sinh sống của người Mông, Lô Lô, Dao và nhiều cộng đồng khác. Nếu gặp chợ phiên đúng lịch, đừng bỏ qua — nhưng hãy hỏi trước khi chụp ảnh chân dung, và ưu tiên mua nông sản, thổ cẩm trực tiếp từ người bản địa như một cách du lịch có trách nhiệm.',
        ],
      },
    ],
    tips: ['Giữ thời gian dự phòng cho các cung đường đèo.', 'Kiểm tra thời tiết trước khi di chuyển giữa các huyện vùng cao.'],
  },
  'ha-long-best-time': {
    title: 'Thời điểm phù hợp để du lịch',
    description: 'Các gợi ý theo mùa, thời tiết và nhịp hoạt động tại Hạ Long.',
    image: '/images/halongbay.png',
    sourceLocation: 'Hạ Long',
    region: 'Quảng Ninh',
    category: 'Đi đâu',
    publishedAt: '2025-11-05',
    sections: [
      {
        heading: 'Bốn mùa trên vịnh',
        paragraphs: [
          'Hạ Long đẹp quanh năm nhưng mỗi mùa một tính cách. Hè (6–8) nước xanh nhất, hợp tắm biển nhưng đông khách và là mùa mưa bão. Thu (9–11) được xem là thời điểm vàng: trời trong, biển lặng, ánh sáng đẹp cho cả tham quan lẫn chụp ảnh. Đông và xuân vịnh trầm hơn, thường có sương sớm tạo cảnh huyền ảo, đổi lại cần áo ấm khi ra khơi.',
        ],
      },
      {
        heading: 'Chọn khung giờ và kiểu hành trình',
        paragraphs: [
          'Cùng một vịnh nhưng trải nghiệm rất khác giữa tàu tham quan trong ngày và du thuyền ngủ đêm. Nếu đi trong ngày, chuyến sớm luôn đáng giá vì vịnh còn vắng; nếu ngủ đêm, bạn sẽ có hoàng hôn và bình minh trên vịnh — hai khoảnh khắc mà khách đi tour ngày không thể chạm tới.',
        ],
      },
      {
        heading: 'Chuẩn bị theo mùa',
        paragraphs: [
          'Mùa hè cần chống nắng nghiêm túc vì trên vịnh gần như không có bóng râm; mùa đông nên có áo gió vì tàu chạy khá lạnh. Quan trọng nhất: theo dõi dự báo bão trước chuyến đi, vì tàu ra vịnh sẽ dừng hoạt động khi biển động.',
        ],
      },
    ],
    tips: ['Ưu tiên ngày trời quang nếu có kế hoạch đi vịnh.', 'Đặt dịch vụ sớm trong mùa hè và các kỳ nghỉ lễ.'],
  },
  'hue-local-food': {
    title: 'Ẩm thực và trải nghiệm bản địa',
    description: 'Các món nên thử và khu vực có nhiều trải nghiệm đời sống địa phương tại Huế.',
    image: '/images/hue.jpg',
    sourceLocation: 'Huế',
    region: 'Thừa Thiên Huế',
    category: 'Ăn gì',
    publishedAt: '2025-11-12',
    sections: [
      {
        heading: 'Bản đồ món Huế cho người mới',
        paragraphs: [
          'Ẩm thực Huế là di sản của một kinh đô: tinh tế, nhiều món nhỏ và đậm vị. Bộ khung nên thử gồm bún bò Huế đúng vị cay nồng, cơm hến dân dã, bộ ba bánh bèo – nậm – lọc, và kết thúc bằng một ly chè trong hàng chục loại chè Huế. Mỗi món đều có phiên bản đường phố lẫn phiên bản quán lâu năm để bạn so sánh.',
        ],
      },
      {
        heading: 'Ăn ở đâu cho đúng nhịp địa phương',
        paragraphs: [
          'Người Huế ăn sáng sớm và ăn tối không muộn, nên các quán ngon thường bán hết trước giờ bạn nghĩ. Khu Thành Nội và chợ Đông Ba tập trung nhiều hàng lâu đời; bữa chiều muộn hãy thử ghé các gánh chè hoặc quán bánh khoái gần cầu Tràng Tiền.',
        ],
      },
      {
        heading: 'Ghép ẩm thực vào lịch tham quan',
        paragraphs: [
          'Một nhịp gọn cho ngày ở Huế: sáng thăm Đại Nội rồi ăn cơm hến; chiều đi lăng Tự Đức hoặc Khải Định; tối dạo cầu Tràng Tiền và kết thúc bằng chè Huế. Ăn theo điểm đến giúp bạn không phải quay ngược đường và cảm nhận món ăn trong đúng không gian của nó.',
        ],
      },
    ],
    tips: ['Kết hợp điểm tham quan với chợ và khu ẩm thực gần đó.', 'Ưu tiên quán có thông tin giá và đánh giá gần đây.'],
  },
  'cu-da-cultural-village': {
    title: 'Chiêm ngưỡng nét đẹp trầm mặc ở làng cổ Cự Đà - Nơi giao thoa văn hóa',
    description: 'Danh sách địa điểm văn hóa và lịch sử có thể kết hợp khi khám phá Hà Nội.',
    image: '/images/hanoi_temple.jpg',
    sourceLocation: 'Làng cổ Cự Đà',
    region: 'Hà Nội',
    category: 'Chơi gì',
    publishedAt: '2025-12-24',
    sections: [
      {
        heading: 'Ngôi làng cổ ven sông Nhuệ',
        paragraphs: [
          'Cách trung tâm Hà Nội chừng 20 km về phía nam, làng Cự Đà (huyện Thanh Oai) là một trong số ít ngôi làng còn giữ được cấu trúc làng Việt cổ ven sông: cổng làng, đường làng xương cá dẫn vào từng xóm, và những nếp nhà ba gian năm gian lợp ngói ta. Điểm đặc biệt của Cự Đà là lớp kiến trúc Pháp đầu thế kỷ XX đan xen — dấu tích một thời làng buôn giàu có bên bến sông Nhuệ.',
          'Đi chậm qua các ngõ nhỏ, bạn sẽ gặp những bức tường vàng loang màu thời gian, cửa gỗ chạm trổ và các hoành phi câu đối còn nguyên trong nhiều gia đình.',
        ],
      },
      {
        heading: 'Nghề miến và tương truyền thống',
        paragraphs: [
          'Cự Đà không chỉ là làng kiến trúc mà còn là làng nghề. Miến dong Cự Đà vàng óng phơi trên những giàn tre dọc đường làng là hình ảnh đặc trưng, nhất là vào những ngày nắng. Nghề làm tương cũng đã tồn tại hàng trăm năm — nếu may mắn, bạn có thể được chủ nhà mời nếm thử tương ủ trong chum sành sau nhà.',
        ],
      },
      {
        heading: 'Ứng xử khi thăm làng',
        paragraphs: [
          'Khác với điểm du lịch được quy hoạch, Cự Đà là không gian sống thường nhật của cư dân. Hãy hỏi trước khi vào sân nhà hay chụp ảnh cận, tránh giờ nghỉ trưa, và gửi lời cảm ơn nếu được mời vào thăm nhà cổ. Chuyến đi sẽ trọn vẹn hơn khi kết hợp với chùa Đậu hoặc làng lụa Vạn Phúc trên cùng trục đường về.',
        ],
      },
    ],
    tips: ['Tôn trọng không gian sinh hoạt của cư dân địa phương.', 'Kết hợp các điểm ngoại thành theo cùng một hướng di chuyển.'],
  },
  'kon-tum-wooden-church': {
    title: 'Nhà thờ gỗ Kon Tum – Kiệt tác kiến trúc gỗ hơn 100 năm giữa lòng Tây Nguyên',
    description: 'Những điểm kiến trúc, văn hóa và thiên nhiên đáng khám phá tại Kon Tum.',
    image: '/images/gialai.png',
    sourceLocation: 'Nhà thờ gỗ Kon Tum',
    region: 'Kon Tum',
    category: 'Đi đâu',
    publishedAt: '2025-11-29',
    sections: [
      {
        heading: 'Kiệt tác gỗ hơn một thế kỷ',
        paragraphs: [
          'Nhà thờ chính tòa Kon Tum — quen gọi là nhà thờ gỗ — được xây dựng trong những năm 1913–1918, gần như hoàn toàn bằng gỗ với kỹ thuật mộng ghép của những người thợ tài hoa. Công trình là cuộc gặp hiếm có giữa kiến trúc Roman phương Tây và ngôn ngữ nhà sàn Ba Na bản địa: mái cao, bộ khung gỗ nâu trầm và tiền sảnh mang dáng dấp nhà rông.',
        ],
      },
      {
        heading: 'Những chi tiết đáng dừng lại',
        paragraphs: [
          'Đừng chỉ chụp mặt tiền rồi rời đi. Hãy ngắm hệ vì kèo gỗ bên trong thánh đường, các ô cửa kính màu kể chuyện bằng thẩm mỹ Tây Nguyên, và khoảng sân rợp bóng cây nơi có thể nhìn trọn tháp chuông vươn trên nền trời. Buổi sáng sớm ánh nắng xiên qua hàng cửa gỗ là thời điểm đẹp nhất.',
        ],
      },
      {
        heading: 'Ghép vào hành trình Kon Tum',
        paragraphs: [
          'Nhà thờ gỗ nằm ngay trung tâm thành phố, cách Tòa Giám mục Kon Tum chỉ vài phút chạy xe — hai công trình gỗ đẹp nhất Tây Nguyên nên được thăm trong cùng buổi. Từ đây, men theo sông Đăk Bla là tới cầu treo Kon Klor và làng Kon K\'tu, khép lại một vòng di sản gọn trong một ngày.',
        ],
      },
    ],
    tips: ['Giữ trang phục phù hợp khi tham quan công trình tôn giáo.', 'Kết hợp các điểm văn hóa trong trung tâm thành phố.'],
  },
  'cho-don-historical-area': {
    title: 'Khám phá ATK Chợ Đồn: Vùng đất lịch sử giữa núi rừng Việt Bắc',
    description: 'Các điểm lịch sử và thiên nhiên có thể kết hợp trong hành trình Bắc Kạn.',
    image: '/images/caobang_bangioc.jpg',
    sourceLocation: 'ATK Chợ Đồn',
    region: 'Bắc Kạn',
    category: 'Đi đâu',
    publishedAt: '2025-11-29',
    sections: [
      {
        heading: 'Vùng an toàn khu giữa núi rừng Việt Bắc',
        paragraphs: [
          'Trong kháng chiến chống Pháp, Chợ Đồn (Bắc Kạn) là một phần của An toàn khu Việt Bắc — nơi đặt nhiều cơ quan đầu não kháng chiến. Ngày nay, các điểm di tích như Bản Ca, Nà Pậu, Nà Quân nằm rải giữa những thung lũng yên tĩnh, cho người đến thăm cảm nhận rõ vì sao vùng đất hiểm trở này từng được chọn làm căn cứ.',
        ],
      },
      {
        heading: 'Đi lại và nhịp tham quan',
        paragraphs: [
          'Các điểm di tích cách nhau khá xa trên đường núi nhỏ, nên hãy tính mỗi cụm ít nhất nửa ngày và ưu tiên phương tiện gầm cao nếu đi mùa mưa. Cách hợp lý nhất là ghép ATK Chợ Đồn với hồ Ba Bể trong cùng chuyến: lịch sử buổi sáng, thiên nhiên buổi chiều.',
        ],
      },
      {
        heading: 'Để chuyến đi trọn vẹn hơn',
        paragraphs: [
          'Di tích cách mạng sẽ dễ cảm hơn nhiều khi có người kể chuyện — nếu khu di tích có hướng dẫn viên, đừng ngại đề nghị. Mùa lúa chín (khoảng tháng 9–10), những thửa ruộng dưới chân các bản Tày cũng tự nó là một điểm tham quan.',
        ],
      },
    ],
    tips: ['Ưu tiên phương tiện phù hợp với đường miền núi.', 'Dành đủ thời gian cho các điểm di tích nằm xa nhau.'],
  },
  'ba-be-an-ma-temple': {
    title: 'Đền An Mã – Nơi linh thiêng giữa lòng hồ Ba Bể',
    description: 'Những điểm đến nổi bật quanh hồ Ba Bể và các khu vực lân cận.',
    image: '/images/hagiang.png',
    sourceLocation: 'Hồ Ba Bể',
    region: 'Bắc Kạn',
    category: 'Đi đâu',
    publishedAt: '2025-11-29',
    sections: [
      {
        heading: 'Ngôi đền giữa lòng hồ',
        paragraphs: [
          'Đền An Mã tọa lạc trên hòn đảo nhỏ cùng tên nổi giữa hồ Ba Bể — hồ nước ngọt tự nhiên trên núi lớn bậc nhất Việt Nam. Cách duy nhất để tới đền là đi thuyền, và chính hành trình lướt qua mặt nước xanh thẳm giữa các vách núi đá vôi mới là một nửa trải nghiệm. Đền là nơi cư dân quanh hồ gửi gắm niềm tin từ nhiều đời.',
        ],
      },
      {
        heading: 'Một vòng hồ Ba Bể',
        paragraphs: [
          'Thuyền thăm đền thường ghép cùng các điểm quanh hồ: động Puông nơi sông Năng chảy xuyên núi, thác Đầu Đẳng cuộn trắng giữa rừng, Ao Tiên trong vắt, và bản Pác Ngòi của người Tày với những nhà sàn ven nước — nơi lý tưởng để nghỉ đêm kiểu homestay.',
        ],
      },
      {
        heading: 'Lưu ý khi đi thuyền và lễ đền',
        paragraphs: [
          'Luôn mặc áo phao theo hướng dẫn của người lái thuyền, và xem dự báo thời tiết vì mặt hồ đổi tính rất nhanh khi có dông. Vào đền, hãy giữ trang phục kín đáo và đi nhẹ nói khẽ — đảo nhỏ, không gian thiêng lan ra tận mép nước.',
        ],
      },
    ],
    tips: ['Theo dõi thời tiết trước các hoạt động trên hồ.', 'Giữ gìn cảnh quan và tuân thủ hướng dẫn tại điểm tâm linh.'],
  },
  'kon-tum-bishop-house': {
    title: 'Khám phá Tòa Giám Mục Kon Tum – Viên ngọc gỗ Tây Nguyên và diện mạo văn hóa',
    description: 'Gợi ý các điểm kiến trúc và văn hóa đặc sắc trong hành trình Kon Tum.',
    image: '/images/daklak.png',
    sourceLocation: 'Tòa Giám Mục Kon Tum',
    region: 'Kon Tum',
    category: 'Đi đâu',
    publishedAt: '2025-11-29',
    sections: [
      {
        heading: 'Viên ngọc gỗ giữa lòng thành phố',
        paragraphs: [
          'Tòa Giám mục Kon Tum được xây dựng đầu thế kỷ XX, là công trình kết hợp nhuần nhuyễn giữa kiến trúc phương Tây và chất liệu bản địa: bộ khung gỗ quý, mái ngói, và dãy hành lang dài hun hút được xem là góc ảnh đặc trưng nhất. Khuôn viên rợp cây xanh khiến nơi đây yên tĩnh khác hẳn nhịp phố bên ngoài.',
        ],
      },
      {
        heading: 'Không gian lưu giữ văn hóa Tây Nguyên',
        paragraphs: [
          'Bên trong có phòng truyền thống trưng bày hiện vật về đời sống các dân tộc Tây Nguyên và lịch sử vùng đất này — một bảo tàng nhỏ nhưng đủ khiến người xem hiểu thêm chiều sâu văn hóa Kon Tum ngoài cảnh đẹp.',
        ],
      },
      {
        heading: 'Kết hợp trong buổi tham quan',
        paragraphs: [
          'Tòa Giám mục cách nhà thờ gỗ Kon Tum chỉ vài phút di chuyển, nên ghép hai điểm trong một buổi sáng là nhịp hợp lý nhất. Đây vẫn là nơi tu học đang hoạt động: hãy giữ yên lặng, ăn mặc lịch sự và tôn trọng các khu vực không mở cho khách.',
        ],
      },
    ],
    tips: ['Kiểm tra giờ mở cửa trước khi đến.', 'Kết hợp với bảo tàng và làng văn hóa gần trung tâm.'],
  },
  'kon-klor-communal-house': {
    title: 'Nhà rông Kon K’lor – Biểu tượng văn hóa Ba Na giữa đại ngàn Tây Nguyên',
    description: 'Những điểm đến giúp bạn tìm hiểu văn hóa bản địa và cảnh quan Kon Tum.',
    image: '/images/gialai.png',
    sourceLocation: 'Nhà rông Kon K’lor',
    region: 'Kon Tum',
    category: 'Đi đâu',
    publishedAt: '2025-11-29',
    sections: [
      {
        heading: 'Biểu tượng của người Ba Na',
        paragraphs: [
          'Nhà rông Kon K\'lor là một trong những nhà rông lớn và đẹp nhất Tây Nguyên, với mái tranh cao vút như lưỡi rìu dựng ngược — dáng hình đã thành biểu tượng của kiến trúc Ba Na. Công trình làm từ gỗ, tre, nứa, lá theo lối truyền thống, là trung tâm sinh hoạt cộng đồng của làng Kon K\'lor bên dòng Đăk Bla.',
        ],
      },
      {
        heading: 'Bên dòng Đăk Bla',
        paragraphs: [
          'Ngay cạnh nhà rông là cầu treo Kon Klor vắt qua sông Đăk Bla, dẫn sang những bãi mía, ruộng vườn ven sông. Đi thêm vài cây số là làng cổ Kon K\'tu, nơi vẫn giữ nếp nhà sàn và khung cảnh sông núi gần như nguyên bản; cả cụm điểm này hợp thành nửa ngày khám phá rất trọn vẹn.',
        ],
      },
      {
        heading: 'Tôn trọng không gian cộng đồng',
        paragraphs: [
          'Nhà rông không phải điểm trưng bày mà là nơi hội họp, lễ hội của dân làng. Hãy hỏi phép trước khi bước lên sàn, không tự ý chạm vào hiện vật, và nếu gặp dịp lễ hội cồng chiêng, hãy đứng xem ở vị trí người làng hướng dẫn — đó cũng là cách đẹp nhất để được chào đón.',
        ],
      },
    ],
    tips: ['Tôn trọng quy định của cộng đồng tại nhà rông.', 'Hỏi trước khi chụp ảnh người dân và hoạt động văn hóa.'],
  },
} as const satisfies Record<string, TravelReference>;

export type TravelReferenceSlug = keyof typeof TRAVEL_REFERENCES;

export const TRAVEL_REFERENCE_SLUGS = Object.keys(TRAVEL_REFERENCES) as TravelReferenceSlug[];
