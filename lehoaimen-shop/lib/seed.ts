// lib/seed.ts - Seed database with Shopee product data
import { getDb } from './db';

const CATEGORIES = [
  { name: 'Phong Thủy', slug: 'phong-thuy', description: 'Thác nước phong thủy, tiểu cảnh, đồ trang trí phong thủy', sort_order: 1 },
  { name: 'Chậu Cây', slug: 'chau-cay', description: 'Chậu đất nung, chậu gốm trồng sen đá, bonsai, cây cảnh', sort_order: 2 },
  { name: 'Trang Trí Nội Thất', slug: 'trang-tri-noi-that', description: 'Đồ trang trí để bàn, kệ, phòng khách', sort_order: 3 },
  { name: 'Bình Hoa & Trang Trí', slug: 'binh-hoa-trang-tri', description: 'Bình cắm hoa gốm, bình decor, lọ hoa', sort_order: 4 },
  { name: 'Khác', slug: 'khac', description: 'Các sản phẩm khác', sort_order: 5 },
];

export const PRODUCTS_DATA = [
  {
    shopee_id: '57913864409', sku: '26433871582',
    name: 'Thác Nước Phong Thủy Cầm Tay Mini Đồ Tôn Cầu Mọi Nhà, Mô Hình Gốm Sứ 20x18x25cm',
    slug: 'thac-nuoc-phong-thuy-cam-tay-mini-gom-su-20x18x25cm',
    description: `Xuất xứ: Tân Phú - Q9 - TP. Thủ Đức\n\nBộ sản phẩm bao gồm:\n• 1 gốm bát đựng chú tiểu gốm sứ\n• 2 ván gỗ nguyên khối sơn PU chống mối mọt\n• 1 máy bơm motor mini sử dụng đầu cáp USB nguồn 5v\n• Bộ hoa cỏ dây leo nhựa\n\nKích thước: dài x rộng x cao = 20x18x25cm | Trọng lượng: 700g\n\nLưu ý:\n• Tránh để sản phẩm tiếp xúc trực tiếp với ánh nắng mặt trời\n• Không ngâm nước sâu hoặc phơi nắng trực tiếp\n• Lắp đặt sản phẩm trên bề mặt phẳng, tránh rung lắc\n\nVới thiết kế nhỏ gọn và đẹp mắt, bộ sản phẩm này giúp không gian làm việc hoặc học hành trở nên thoáng đãng và dễ chịu. Shop nhận thiết kế theo yêu cầu.`,
    category_slug: 'phong-thuy',
    cover_image: 'https://cf.shopee.vn/file/vn-11134201-81ztc-mqkk377j1xqk86',
    images: ['https://cf.shopee.vn/file/vn-11134201-81ztc-mqkk377j1xqk86','https://cf.shopee.vn/file/vn-11134201-81ztc-mqkk3807r6dcb4','https://cf.shopee.vn/file/vn-11134201-81ztc-mqkk38trecy3ae','https://cf.shopee.vn/file/vn-11134201-81ztc-mqkk39q61rlsb9'],
    variation_group: 'Phân loại',
    min_price: 204000, max_price: 239000, total_stock: 222, weight: 700, is_featured: 1, is_hot: 1,
    variants: [
      { variation_name: 'Trọn bộ', price: 239000, stock: 111, image: 'https://cf.shopee.vn/file/vn-11134201-81ztc-mqkk3ate0c8wa6' },
      { variation_name: 'Chú tiểu+bơm', price: 204000, stock: 111, image: 'https://cf.shopee.vn/file/vn-11134201-81ztc-mqkk3bvk4e1a8c' },
    ]
  },
  {
    shopee_id: '57863871755', sku: '51810613726',
    name: 'Chậu Giúp Giâm Sen Đá Cô Gái Mini Gốm Đỏ Sân Vườn Cao Cấp',
    slug: 'chau-sen-da-co-gai-mini-gom-do-san-vuon',
    description: `Chậu cây cỡ nhỏ Lisa Đất Nung - Đá Cô Gái Mini Bonsai Decor Sân Vườn\n\nChậu mini lý tưởng cho sen đá và bonsai nhỏ, kết hợp phong cách tự nhiên với vẻ đẹp gần gũi thiên nhiên.\n\n✅ Chất liệu: Đất nung đỏ tự nhiên cao cấp, đảm bảo độ bền cao\n✅ Kích thước: Cao 18cm, miệng 9cm\n✅ Sử dụng được trong nhà và ngoài trời\n✅ Dễ dàng vệ sinh và bảo quản`,
    category_slug: 'chau-cay',
    cover_image: 'https://cf.shopee.vn/file/vn-11134201-81ztc-mqkj6m7wu9lb70',
    images: ['https://cf.shopee.vn/file/vn-11134201-81ztc-mqkj6m7wu9lb70','https://cf.shopee.vn/file/vn-11134201-81ztc-mqkj6nekke1959','https://cf.shopee.vn/file/vn-11134201-81ztc-mqkj6ophk4cr49','https://cf.shopee.vn/file/vn-11134201-81ztc-mqkj6pxb5g5e98','https://cf.shopee.vn/file/vn-11134201-81ztc-mqkj6r5z6i2od3','https://cf.shopee.vn/file/vn-11134201-81ztc-mqkj6sgmvvnw51'],
    variation_group: '',
    min_price: 140000, max_price: 140000, total_stock: 100, weight: 500, is_new: 1,
    variants: [
      { variation_name: '', price: 140000, stock: 100 },
    ]
  },
  {
    shopee_id: '57613876754', sku: '26284633542',
    name: 'Văn Khuyên Lu Gốm Tre Lớn Cho Phong Thủy Đồ Bàn Mini',
    slug: 'van-khuyen-lu-gom-tre-lon-phong-thuy-do-ban-mini',
    description: `Chậu thác nước phong thủy mini handmade\n\nBộ sản phẩm gồm: gốm lu bát đựng mini, ván gỗ nguyên khối sơn PU chống mối mọt, máy bơm motor mini USB 5V, dây hoa cỏ dây leo nhựa, dây bố decor.\n\nKích thước: 27x22x29cm | Trọng lượng: 950g\n\nSản phẩm được thiết kế nhỏ gọn, không chiếm diện tích lớn trên bàn học hoặc bàn làm việc. Bộ sưu tập phong thủy có thể giúp giảm căng thẳng và nâng cao khả năng sáng tạo.`,
    category_slug: 'phong-thuy',
    cover_image: 'https://cf.shopee.vn/file/vn-11134201-81ztc-mqkk5r5zgop82b',
    images: ['https://cf.shopee.vn/file/vn-11134201-81ztc-mqkk5r5zgop82b','https://cf.shopee.vn/file/vn-11134201-81ztc-mqkk5s48buo2c3','https://cf.shopee.vn/file/vn-11134201-81ztc-mqkk5sztoef568','https://cf.shopee.vn/file/vn-11134201-81ztc-mqkk5trlhgqp4a','https://cf.shopee.vn/file/vn-11134201-81ztc-mqkk5ukwgt8i80','https://cf.shopee.vn/file/vn-11134201-81ztc-mqkk5vmzf30id0','https://cf.shopee.vn/file/vn-11134201-81ztc-mqkk5wrs2l8i9b','https://cf.shopee.vn/file/vn-11134201-81ztc-mqkk5xsc5wjw9b'],
    variation_group: 'Phân loại',
    min_price: 239000, max_price: 289000, total_stock: 222, weight: 950, is_featured: 1,
    variants: [
      { variation_name: 'Gốm hoa', price: 239000, stock: 0, image: 'https://cf.shopee.vn/file/vn-11134201-81ztc-mqkk5ziqdlhq0b' },
      { variation_name: 'Gốm nâu', price: 279000, stock: 111, image: 'https://cf.shopee.vn/file/vn-11134201-81ztc-mqkk5ynqq32876' },
      { variation_name: 'Gốm trụ đỏ', price: 289000, stock: 111, image: 'https://cf.shopee.vn/file/vn-11134201-81ztc-mqkk60f14miz88' },
    ]
  },
  {
    shopee_id: '57563867101', sku: '56111484858',
    name: 'Máy Thoát Nước Phong Thủy Mini 20x10x25cm Bộ Cây Tre Chậu Sứ',
    slug: 'may-thoat-nuoc-phong-thuy-mini-20x10x25cm-cay-tre-chau-su',
    description: `Bộ Thác Nước Phong Thủy Mini Ống Tre, Chậu Gốm Sứ, Máy Bơm Motor Mini handmade\n\nKích thước: 20x10x25cm | Trọng lượng: 800g\n\nBộ sản phẩm bao gồm:\n• 1 chậu đựng\n• 2 đế gỗ\n• 1 máy bơm motor mini USB 5V\n\nSản phẩm sử dụng bơm motor mini để tạo ra thác nước nhỏ, giúp tạo âm nhạc nhẹ nhàng và tạo ra một không gian yên bình.`,
    category_slug: 'phong-thuy',
    cover_image: 'https://cf.shopee.vn/file/vn-11134201-81ztc-mqkkcd9x572m64',
    images: ['https://cf.shopee.vn/file/vn-11134201-81ztc-mqkkcd9x572m64','https://cf.shopee.vn/file/vn-11134201-81ztc-mqkkcepfq9z568','https://cf.shopee.vn/file/vn-11134201-81ztc-mqkkcg4r239e39','https://cf.shopee.vn/file/vn-11134201-81ztc-mqkkchn9c1la43','https://cf.shopee.vn/file/vn-11134201-81ztc-mqkkcjnlxkoy9d','https://cf.shopee.vn/file/vn-11134201-81ztc-mqkkcl5eknwsc0','https://cf.shopee.vn/file/vn-11134201-81ztc-mqkkcmfslon494'],
    variation_group: 'Loại',
    min_price: 225000, max_price: 235000, total_stock: 222, weight: 800,
    variants: [
      { variation_name: 'Trọn bộ', price: 235000, stock: 111, image: 'https://cf.shopee.vn/file/vn-11134201-81ztc-mqkkcnkccxe34a' },
      { variation_name: '0 chú tiểu', price: 225000, stock: 111, image: 'https://cf.shopee.vn/file/vn-11134201-81ztc-mqkkcoty25u4a6' },
    ]
  },
  {
    shopee_id: '57313876521', sku: '56363710722',
    name: 'Chậu Thác Nước Phong Thủy Gốm Sứ Tre Bơm Mini Kích thước 28x12cm',
    slug: 'chau-thac-nuoc-phong-thuy-gom-su-tre-bom-mini-28x12cm',
    description: `Chậu Thác Nước Phong Thủy Gốm Sứ Ống Tre\n\nBộ sản phẩm trang trí mini được thiết kế nhỏ gọn, không chiếm diện tích lớn. Sản phẩm sử dụng bơm motor mini với kích thước miệng 28cm và cao 12cm.\n\nTrọng lượng: 1100g\n\nChậu được làm thủ công từ gốm sứ và ống tre, mang đến vẻ đẹp tự nhiên và phong thủy.`,
    category_slug: 'phong-thuy',
    cover_image: 'https://cf.shopee.vn/file/vn-11134201-81ztc-mqkiv7x6cjk0a9',
    images: ['https://cf.shopee.vn/file/vn-11134201-81ztc-mqkiv7x6cjk0a9','https://cf.shopee.vn/file/vn-11134201-81ztc-mqkiv9elx0y441','https://cf.shopee.vn/file/vn-11134201-81ztc-mqkivaqrco3l00'],
    variation_group: 'Nhóm',
    min_price: 217000, max_price: 435000, total_stock: 443, weight: 1100, is_featured: 1, is_hot: 1,
    variants: [
      { variation_name: 'Chậu xanh ngọc', price: 435000, stock: 111, image: 'https://cf.shopee.vn/file/vn-11134201-81ztc-mqkivbzixgjk0a' },
      { variation_name: 'Chậu đen', price: 425000, stock: 110, image: 'https://cf.shopee.vn/file/vn-11134201-81ztc-mqkivg3ngnwse4' },
      { variation_name: 'Bộ khung gác chậu', price: 217000, stock: 0, image: 'https://cf.shopee.vn/file/vn-11134201-81ztc-mqkivhb72fwidb' },
      { variation_name: 'Chậu trắng', price: 415000, stock: 111, image: 'https://cf.shopee.vn/file/vn-11134201-81ztc-mqkiverqf40da9' },
      { variation_name: 'Chậu xanh dương', price: 415000, stock: 111, image: 'https://cf.shopee.vn/file/vn-11134201-81ztc-mqkivde42qrx53' },
    ]
  },
  {
    shopee_id: '57121284103', sku: '',
    name: 'Chậu Gốm Xe Lam Mini Trồng Sen Đá - Chậu Cây Cảnh Để Bàn Decor',
    slug: 'chau-gom-xe-lam-mini-trong-sen-da-chau-cay-canh-de-ban',
    description: `Chậu Gốm Mini Trồng Sen Đá - Chậu Cây Cảnh Để Bàn Decor Phong Cách Tối Giản\n\nChiếc chậu gốm mini xinh xắn giúp góc làm việc, bàn học hay phòng khách trở nên xanh mát và tinh tế.\n\n📏 Kích thước: 13 x 7 x 9 cm\n🏺 Chất liệu: Gốm đất nung cao cấp\n🎨 Màu sắc: Cam đỏ, nâu đen, trắng men (tùy phân loại)\n🇻🇳 Xuất xứ: Việt Nam\n\nShop cam kết:\n✅ Sản phẩm đúng như hình\n✅ Đóng gói cẩn thận chống vỡ\n✅ Hỗ trợ 1 đổi 1 nếu bể vỡ do vận chuyển`,
    category_slug: 'chau-cay',
    cover_image: 'https://cf.shopee.vn/file/sg-11134201-8259t-mv9y5wlepz458b',
    images: ['https://cf.shopee.vn/file/sg-11134201-8259t-mv9y5wlepz458b','https://cf.shopee.vn/file/sg-11134201-825ak-mv9y5wz4f8ci28','https://cf.shopee.vn/file/sg-11134201-825bb-mv9y5xf46eq138','https://cf.shopee.vn/file/sg-11134201-8258z-mv9y5xswhqfa97'],
    variation_group: '',
    min_price: 50000, max_price: 50000, total_stock: 20, weight: 300, is_new: 1,
    variants: [
      { variation_name: '', price: 50000, stock: 20 },
    ]
  },
  {
    shopee_id: '56863871871', sku: '56011500059',
    name: 'Thác Nước Ống Tre Phong Cách Mộc Mạc Chậu Gốm Sứ 28x10x20cm Cho Phòng Thờ',
    slug: 'thac-nuoc-ong-tre-moc-mac-chau-gom-su-28x10x20cm-phong-tho',
    description: `Bồn tiểu cảnh handmade phong cách mộc mạc kích thước 28x10x20cm\n\nSản phẩm bao gồm: gốm sứ chậu đựng, đế gỗ nguyên khối, ống tre sơn bóng, máy bơm motor mini 3W 220V và chú tiểu.\n\n• Kích thước: 28x10x20cm | Trọng lượng: 800g\n• Chậu gốm sứ cao cấp\n• Đế gỗ nguyên khối chắc chắn\n• Ống tre sơn bóng mang vẻ đẹp mộc mạc\n• Shop nhận thiết kế theo kích thước và chất liệu riêng lẻ`,
    category_slug: 'phong-thuy',
    cover_image: 'https://cf.shopee.vn/file/vn-11134201-81ztc-mqkjsh302via4e',
    images: ['https://cf.shopee.vn/file/vn-11134201-81ztc-mqkjsh302via4e','https://cf.shopee.vn/file/vn-11134201-81ztc-mqkjsicp0p3h9b','https://cf.shopee.vn/file/vn-11134201-81ztc-mqkjsjnlmc5cbf','https://cf.shopee.vn/file/vn-11134201-81ztc-mqkjskti87wu2d'],
    variation_group: 'Loại',
    min_price: 235000, max_price: 245000, total_stock: 222, weight: 800,
    variants: [
      { variation_name: 'Trọn bộ', price: 245000, stock: 111, image: 'https://cf.shopee.vn/file/vn-11134201-81ztc-mqkjsm3j13pnc4' },
      { variation_name: '0 chú tiểu', price: 235000, stock: 111, image: 'https://cf.shopee.vn/file/vn-11134201-81ztc-mqkjsndg4hzgbb' },
    ]
  },
  {
    shopee_id: '56321284110', sku: '',
    name: 'Chậu Đất Nung Chú Khỉ Phun Nước - Hình Chú Khỉ Ngộ Nghĩnh Cao 16cm',
    slug: 'chau-dat-nung-chu-khi-phun-nuoc-ngon-nghinh-cao-16cm',
    description: `Chậu đất nung hình chú khỉ ngộ nghĩnh, kết hợp làm tiểu cảnh phun nước hoặc trồng cây.\n\n📏 Kích thước: Cao 16cm, ngang 15cm, miệng 5cm\n🏺 Chất liệu: Gốm nung đỏ tự nhiên\n🌿 Sử dụng: Ngoài trời và trong nhà\n📍 Xuất xứ: Bình Dương, Việt Nam\n\nSản phẩm có đục lỗ để thông ống tạo vòi phun nước hoặc kết hợp trồng cây, sen đá.\n⚠️ Quý khách vui lòng quay video khi nhận hàng để được đổi trả khi bể, vỡ sản phẩm.`,
    category_slug: 'chau-cay',
    cover_image: 'https://cf.shopee.vn/file/sg-11134201-8259z-mv9y4vnoledj54',
    images: ['https://cf.shopee.vn/file/sg-11134201-8259z-mv9y4vnoledj54','https://cf.shopee.vn/file/sg-11134201-825al-mv9y4w2yu0huf0','https://cf.shopee.vn/file/sg-11134201-8259v-mv9y4wg7od8l18','https://cf.shopee.vn/file/sg-11134201-8259l-mv9y4wy9q41y06'],
    variation_group: '',
    min_price: 120000, max_price: 120000, total_stock: 20, weight: 500,
    variants: [
      { variation_name: '', price: 120000, stock: 20 },
    ]
  },
  {
    shopee_id: '56321284030', sku: '',
    name: 'Chậu Sen Đá Bình Tưới Mini Gốm Đất Nung - Miệng 8cm Cao 7cm',
    slug: 'chau-sen-da-binh-tuoi-mini-gom-dat-nung-mieng-8cm-cao-7cm',
    description: `CHẬU ĐẤT NUNG BÌNH TƯỚI MINI\n\n📍 Xuất xứ: TP. Hồ Chí Minh, Việt Nam\n\n📏 Kích thước:\n• Chiều cao: 7cm\n• Chiều rộng: 8cm\n• Đường kính miệng trồng: 7cm\n\n🎨 Màu sắc: Nâu gạch tự nhiên\n\n✨ Đặc điểm nổi bật:\n• Chất liệu đất nung mộc mạc, gần gũi thiên nhiên\n• Thiết kế bình tưới mini độc đáo, tạo điểm nhấn\n• Có lỗ thoát nước giúp cây phát triển tốt\n\n🌿 Phù hợp trồng: Sen đá, xương rồng, cây cảnh mini`,
    category_slug: 'chau-cay',
    cover_image: 'https://cf.shopee.vn/file/sg-11134201-8259i-mv9y4tgfrea045',
    images: ['https://cf.shopee.vn/file/sg-11134201-8259i-mv9y4tgfrea045','https://cf.shopee.vn/file/sg-11134201-8257s-mv9y4tvxq39h20','https://cf.shopee.vn/file/sg-11134201-825b2-mv9y4ucxhuyv83'],
    variation_group: '',
    min_price: 60000, max_price: 60000, total_stock: 20, weight: 200,
    variants: [
      { variation_name: '', price: 60000, stock: 20 },
    ]
  },
  {
    shopee_id: '55063864254', sku: '51360560412',
    name: 'Nước Chậu Gốm Mini 27cm Tiểu Cảnh Trang Trí Góc Phối Tủ',
    slug: 'nuoc-chau-gom-mini-27cm-tieu-canh-trang-tri-goc-phoi-tu',
    description: `Nguồn nước mini handmade với thiết kế nhỏ gọn\n\nBộ sản phẩm bao gồm: chậu gốm men + lu men, đá cuội, miếng đá nguyên khối, chú tiểu gốm sứ và máy bơm motor mini 220V.\n\n📏 Kích thước tổng thể: Rộng 27cm, Cao 28cm\n⚖️ Trọng lượng: 2800g\n\nThích hợp trang trí trên bàn học, bàn làm việc, ban công sân nhà hoặc tiểu cảnh mini.`,
    category_slug: 'trang-tri-noi-that',
    cover_image: 'https://cf.shopee.vn/file/vn-11134201-81ztc-mqkj4uoczeh948',
    images: ['https://cf.shopee.vn/file/vn-11134201-81ztc-mqkj4uoczeh948','https://cf.shopee.vn/file/vn-11134201-81ztc-mqkj4vvk7y199d','https://cf.shopee.vn/file/vn-11134201-81ztc-mqkj4x5qpv5u79','https://cf.shopee.vn/file/vn-11134201-81ztc-mqkj4yg4l82729'],
    variation_group: 'Loại',
    min_price: 310000, max_price: 459000, total_stock: 444, weight: 2800, is_featured: 1,
    variants: [
      { variation_name: 'Sôi xanh', price: 310000, stock: 111, image: 'https://cf.shopee.vn/file/vn-11134201-81ztc-mqkj4znge41s94' },
      { variation_name: 'Đen bóng', price: 350000, stock: 111, image: 'https://cf.shopee.vn/file/vn-11134201-81ztc-mqkj50wy40zyb2' },
      { variation_name: 'Lu xanh', price: 380000, stock: 111, image: 'https://cf.shopee.vn/file/vn-11134201-81ztc-mqkj524czua303' },
      { variation_name: 'Trụ đen', price: 420000, stock: 111, image: 'https://cf.shopee.vn/file/vn-11134201-81ztc-mqkj53hafzm66e' },
    ]
  },
  {
    shopee_id: '54653859666', sku: '',
    name: 'Thác Nước Phong Thủy Mini Chú Tiểu Bên Hồ Gốm Sứ Bơm USB 5V 20x18x25cm',
    slug: 'thac-nuoc-phong-thuy-mini-chu-tieu-ben-ho-gom-su-bom-usb-5v',
    description: `Thông tin chi tiết sản phẩm:\n\n📍 Xuất xứ: Tân Phú - Q9 - TP. Thủ Đức\n\nBộ sản phẩm bao gồm:\n• 1 Gốm bát đựng, chú Tiểu gốm sứ\n• 2 Ván gỗ nguyên khối sơn PU chống mối mọt\n• 1 Máy bơm motor mini USB nguồn 5V\n• Bộ hoa cỏ dây leo nhựa\n\n📏 Kích thước: 20x18x25cm | ⚖️ Trọng lượng: 700g\n\nHandmade với thiết kế nhỏ gọn, có thể giúp giảm căng thẳng trong học tập và công việc.`,
    category_slug: 'phong-thuy',
    cover_image: 'https://cf.shopee.vn/file/sg-11134201-81zvm-mit7bu28v18i06',
    images: ['https://cf.shopee.vn/file/sg-11134201-81zvm-mit7bu28v18i06','https://cf.shopee.vn/file/sg-11134201-81zu1-mit7bu9xi3nr30','https://cf.shopee.vn/file/sg-11134201-81zvx-mit7buim49oj4a','https://cf.shopee.vn/file/sg-11134201-81zuh-mit7buqyhddvb5','https://cf.shopee.vn/file/sg-11134201-81zto-mit7bv0zfvgn87','https://cf.shopee.vn/file/sg-11134201-81zvt-mit7bvayu9z72c'],
    variation_group: 'Phân loại',
    min_price: 180000, max_price: 210000, total_stock: 99, weight: 700,
    variants: [
      { variation_name: 'Trọn bộ', price: 210000, stock: 50, image: 'https://cf.shopee.vn/file/sg-11134201-81zto-mit7bv0zfvgn87' },
      { variation_name: 'Chú tiểu+bơm', price: 180000, stock: 49, image: 'https://cf.shopee.vn/file/sg-11134201-81zvt-mit7bvayu9z72c' },
    ]
  },
  {
    shopee_id: '54613876387', sku: '29333863956',
    name: 'Chậu Nước Phong Thủy Mini Ống Tre Bát Gốm Sứ 25x20x24cm',
    slug: 'chau-nuoc-phong-thuy-mini-ong-tre-bat-gom-su-25x20x24cm',
    description: `Bộ Truyền Nước Phong Thủy Mini Ống Tre\n\nBộ sản phẩm bao gồm: 1 chậu đựng gốm sứ, 2 đế gỗ nguyên khối, ống tre sơn bóng, máy bơm motor mini.\n\n📏 Kích thước: 25x20x24cm | ⚖️ Trọng lượng: 800g\n\nShop nhận thiết kế theo yêu cầu khách hàng về kích thước và chất liệu.`,
    category_slug: 'phong-thuy',
    cover_image: 'https://cf.shopee.vn/file/vn-11134201-81ztc-mqkitk4h60aq9f',
    images: ['https://cf.shopee.vn/file/vn-11134201-81ztc-mqkitk4h60aq9f','https://cf.shopee.vn/file/vn-11134201-81ztc-mqkitldgtlvmee'],
    variation_group: 'Trọn bộ',
    min_price: 100000, max_price: 405000, total_stock: 774, weight: 800, is_hot: 1,
    variants: [
      { variation_name: 'Khung tre kèm bơm', price: 180000, stock: 100, image: 'https://cf.shopee.vn/file/vn-11134201-81ztc-mqkitmn9cm4t51' },
      { variation_name: 'Bơm,tre,bìnhlọc 30cm', price: 220000, stock: 100, image: 'https://cf.shopee.vn/file/vn-11134201-81ztc-mqkitnrgs0zva1' },
      { variation_name: 'Khung ống R4mm D10cm', price: 100000, stock: 100, image: 'https://cf.shopee.vn/file/vn-11134201-81ztc-mqkitovpm1vzeb' },
      { variation_name: 'Khung tre+bình lọc', price: 250000, stock: 100, image: 'https://cf.shopee.vn/file/vn-11134201-81ztc-mqkitq1wejuqfe' },
      { variation_name: 'Trọn bộ trắng', price: 350000, stock: 100, image: 'https://cf.shopee.vn/file/vn-11134201-81ztc-mqkitr7mxcld6e' },
      { variation_name: 'Trắng 0 chú tiểu', price: 300000, stock: 100, image: 'https://cf.shopee.vn/file/vn-11134201-81ztc-mqkitsdp5la917' },
      { variation_name: 'Bộ ống tre chum', price: 320000, stock: 74, image: 'https://cf.shopee.vn/file/vn-11134201-81ztc-mqkittmy6b5ufc' },
    ]
  },
  {
    shopee_id: '54471351622', sku: '',
    name: 'Bình Cắm Hoa Tết Gốm Atlantic Cao 20cm - Trang Trí Góc Học Tập Làm Việc',
    slug: 'binh-cam-hoa-tet-gom-atlantic-cao-20cm-trang-tri-goc-hoc-tap',
    description: `CHẬU GỐM ATLANTIC – MẪU MINI TRANG TRÍ & TIỂU CẢNH\n\n📏 Thông tin sản phẩm:\n• Chất liệu: Gốm Atlantic\n• Chiều cao tổng: 20cm\n• Phần bụng phủ bì: 12cm\n• Miệng: 3cm\n\nThiết kế nhỏ gọn, phù hợp trang trí bàn, kệ, góc tiểu cảnh hoặc kết hợp cùng các mẫu decor khác.\n\n✨ Ưu điểm:\n• Gốm chắc chắn, bề mặt men đẹp, dễ vệ sinh\n• Kích thước nhỏ gọn, dễ bố trí nhiều không gian\n• Kiểu dáng phù hợp decor tự nhiên, tối giản và hiện đại`,
    category_slug: 'binh-hoa-trang-tri',
    cover_image: 'https://cf.shopee.vn/file/sg-11134201-8259p-mv9y5i3egpojae',
    images: ['https://cf.shopee.vn/file/sg-11134201-8259p-mv9y5i3egpojae','https://cf.shopee.vn/file/sg-11134201-825aa-mv9y5jewahon53','https://cf.shopee.vn/file/sg-11134201-825bc-mv9y5jnm1fra2f','https://cf.shopee.vn/file/sg-11134201-8258o-mv9y5ju9t3iie6','https://cf.shopee.vn/file/sg-11134201-8259l-mv9y5k168jrd78','https://cf.shopee.vn/file/sg-11134201-8258u-mv9y5kbifojob1','https://cf.shopee.vn/file/sg-11134201-825aj-mv9y5kkpuwas0d','https://cf.shopee.vn/file/sg-11134201-8259h-mv9y5kvyfuvd45'],
    variation_group: 'Màu sắc',
    min_price: 89000, max_price: 220000, total_stock: 60, weight: 400, is_new: 1,
    variants: [
      { variation_name: 'Màu xanh', price: 180000, stock: 20, image: 'https://cf.shopee.vn/file/sg-11134201-8258u-mv9y5kbifojob1' },
      { variation_name: 'Màu trắng', price: 180000, stock: 20, image: 'https://cf.shopee.vn/file/sg-11134201-825aj-mv9y5kkpuwas0d' },
      { variation_name: 'Bát trụ', price: 220000, stock: 20, image: 'https://cf.shopee.vn/file/sg-11134201-8259h-mv9y5kvyfuvd45' },
    ]
  },
  {
    shopee_id: '54453859693', sku: '',
    name: 'Thác Nước Phong Thủy Gốc Tre + Gốm Để Bàn Bơm Mini USB 5V 20x15x25cm',
    slug: 'thac-nuoc-phong-thuy-goc-tre-gom-de-ban-bom-mini-usb-5v-20x15x25cm',
    description: `Thông tin chi tiết sản phẩm:\n\n📍 Xuất xứ: Tân Phú - Q9 - TP. Thủ Đức\n\nBộ sản phẩm bao gồm:\n• 1 Gốm bát đựng\n• 2 Ván gỗ nguyên khối sơn PU chống mối mọt\n• 1 Máy bơm motor mini USB 5V\n• Bộ hoa cỏ dây leo nhựa\n• Dây bố decor\n• Gốc tre nguyên nhánh\n\n📏 Kích thước: 20x15x25cm | ⚖️ Trọng lượng: 700g`,
    category_slug: 'binh-hoa-trang-tri',
    cover_image: 'https://cf.shopee.vn/file/sg-11134201-81zwq-mit7b2crn47477',
    images: ['https://cf.shopee.vn/file/sg-11134201-81zwq-mit7b2crn47477','https://cf.shopee.vn/file/sg-11134201-81zvu-mit7b2omi6m92a','https://cf.shopee.vn/file/sg-11134201-81ztp-mit7b304x4au4c','https://cf.shopee.vn/file/sg-11134201-81zwd-mit7b3d7aarsa0','https://cf.shopee.vn/file/sg-11134201-81zug-mit7b3pv514x50','https://cf.shopee.vn/file/sg-11134201-81ztd-mit7b46w4av69c'],
    variation_group: 'Bát gốm',
    min_price: 175000, max_price: 185000, total_stock: 0, weight: 700,
    variants: [
      { variation_name: 'Bát trụ miệng 10cm', price: 185000, stock: 0, image: 'https://cf.shopee.vn/file/sg-11134201-81zv8-mit7b5qckp35c5' },
      { variation_name: 'Bát tròn miệng 10cm', price: 175000, stock: 0, image: 'https://cf.shopee.vn/file/sg-11134201-81zw2-mit7b5z4uy2o5a' },
    ]
  },
  {
    shopee_id: '53713876665', sku: '',
    name: 'Bể Tạo Thủy Điệu Gốm Men Phong Thuỷ 22cm Cao Rộng 30cm',
    slug: 'be-tao-thuy-dieu-gom-men-phong-thuy-22cm-rong-30cm',
    description: `Bể gốm men phong thủy cao cấp, kích thước 22cm cao, rộng 30cm. Phù hợp làm tiểu cảnh phong thủy, trang trí phòng khách, phòng ngủ. Handmade thủ công tạo ra những tác phẩm độc đáo và tinh tế.`,
    category_slug: 'phong-thuy',
    cover_image: 'https://cf.shopee.vn/file/vn-11134201-81ztc-mqkk5r5zgop82b',
    images: ['https://cf.shopee.vn/file/vn-11134201-81ztc-mqkk5r5zgop82b'],
    variation_group: '',
    min_price: 305000, max_price: 370000, total_stock: 777, weight: 1500,
    variants: [
      { variation_name: 'Gốm men xanh', price: 305000, stock: 300 },
      { variation_name: 'Gốm men nâu', price: 370000, stock: 477 },
    ]
  },
  {
    shopee_id: '52863876942', sku: '',
    name: 'Chậu Hoa Trang Trí Mini Xích Đu 2 Tầng Decor 40x13x13cm',
    slug: 'chau-hoa-trang-tri-mini-xich-du-2-tang-decor-40x13x13cm',
    description: `Giá treo chậu hoa mini dạng xích đu 2 tầng, kích thước 40x13x13cm. Thiết kế độc đáo, phong cách bohemian. Phù hợp treo ban công, cửa sổ, góc phòng. Chất liệu gỗ và kim loại bền chắc.`,
    category_slug: 'trang-tri-noi-that',
    cover_image: 'https://cf.shopee.vn/file/vn-11134201-81ztc-mqkk5r5zgop82b',
    images: ['https://cf.shopee.vn/file/vn-11134201-81ztc-mqkk5r5zgop82b'],
    variation_group: 'Size',
    min_price: 18000, max_price: 88000, total_stock: 333, weight: 300,
    variants: [
      { variation_name: 'Size nhỏ', price: 18000, stock: 111 },
      { variation_name: 'Size vừa', price: 55000, stock: 111 },
      { variation_name: 'Size lớn', price: 88000, stock: 111 },
    ]
  },
  {
    shopee_id: '45253885727', sku: '',
    name: 'Thác Nước Phong Thủy Mini Lu Gốm Sứ Để Bàn Bơm USB 5V',
    slug: 'thac-nuoc-phong-thuy-mini-lu-gom-su-de-ban-bom-usb-5v',
    description: `Thác nước phong thủy mini lu gốm sứ handmade. Sử dụng bơm motor mini USB 5V. Thiết kế nhỏ gọn phù hợp để bàn làm việc, học tập. Mang lại sự bình yên và giảm căng thẳng.`,
    category_slug: 'phong-thuy',
    cover_image: 'https://cf.shopee.vn/file/vn-11134201-81ztc-mqkk377j1xqk86',
    images: ['https://cf.shopee.vn/file/vn-11134201-81ztc-mqkk377j1xqk86','https://cf.shopee.vn/file/vn-11134201-81ztc-mqkk3807r6dcb4'],
    variation_group: 'Phân loại',
    min_price: 219000, max_price: 249000, total_stock: 300, weight: 700, is_featured: 1,
    variants: [
      { variation_name: 'Trọn bộ', price: 249000, stock: 150 },
      { variation_name: '0 chú tiểu', price: 219000, stock: 150 },
    ]
  },
  {
    shopee_id: '46463889518', sku: '',
    name: 'Bể Giả Thác Nước Phong Thủy Inox USB 5V Kích Thước 25cm',
    slug: 'be-gia-thac-nuoc-phong-thuy-inox-usb-5v-kich-thuoc-25cm',
    description: `Bể giả thác nước phong thủy chất liệu Inox cao cấp, bơm USB 5V. Kích thước 25cm. Thiết kế hiện đại, bền đẹp. Tiếng nước chảy nhẹ nhàng tạo không khí thư thái.`,
    category_slug: 'phong-thuy',
    cover_image: 'https://cf.shopee.vn/file/vn-11134201-81ztc-mqkk377j1xqk86',
    images: ['https://cf.shopee.vn/file/vn-11134201-81ztc-mqkk377j1xqk86'],
    variation_group: 'Màu',
    min_price: 219000, max_price: 249000, total_stock: 333, weight: 600,
    variants: [
      { variation_name: 'Bạc', price: 219000, stock: 200 },
      { variation_name: 'Đen', price: 249000, stock: 133 },
    ]
  },
  {
    shopee_id: '44763892032', sku: '',
    name: 'Thủy Sinh Decor Gốm Chậu Nước Chảy Cho Ban Công 31x51cm',
    slug: 'thuy-sinh-decor-gom-chau-nuoc-chay-cho-ban-cong-31x51cm',
    description: `Chậu thủy sinh decor gốm men nước chảy kích thước 31x51cm. Phù hợp đặt ban công, sân vườn. Thiết kế nghệ thuật, tạo điểm nhấn không gian sống.`,
    category_slug: 'trang-tri-noi-that',
    cover_image: 'https://cf.shopee.vn/file/vn-11134201-81ztc-mqkk5r5zgop82b',
    images: ['https://cf.shopee.vn/file/vn-11134201-81ztc-mqkk5r5zgop82b'],
    variation_group: 'Size',
    min_price: 275000, max_price: 540000, total_stock: 444, weight: 3000, is_featured: 1,
    variants: [
      { variation_name: 'Size nhỏ', price: 275000, stock: 222 },
      { variation_name: 'Size lớn', price: 540000, stock: 222 },
    ]
  },
  {
    shopee_id: '45913886919', sku: '',
    name: 'Chậu Đất Nung Bình Tưới Cho Sen Đá Xương Rồng 8x8cm',
    slug: 'chau-dat-nung-binh-tuoi-cho-sen-da-xuong-rong-8x8cm',
    description: `Chậu đất nung hình bình tưới mini dành cho sen đá, xương rồng. Kích thước 8x8cm. Chất liệu đất nung tự nhiên, thoáng khí tốt cho cây.`,
    category_slug: 'chau-cay',
    cover_image: 'https://cf.shopee.vn/file/sg-11134201-8259i-mv9y4tgfrea045',
    images: ['https://cf.shopee.vn/file/sg-11134201-8259i-mv9y4tgfrea045'],
    variation_group: '',
    min_price: 45000, max_price: 45000, total_stock: 100, weight: 200,
    variants: [
      { variation_name: '', price: 45000, stock: 100 },
    ]
  },
  {
    shopee_id: '26245281006', sku: '',
    name: 'Chậu Đất Nung Trồng Sen Đá Tý Sún Mini',
    slug: 'chau-dat-nung-trong-sen-da-ty-sun-mini',
    description: `Chậu đất nung hình Tý Sún nhỏ xinh dành cho sen đá. Handmade từ đất nung tự nhiên. Độc đáo, cute, phù hợp làm quà tặng.`,
    category_slug: 'chau-cay',
    cover_image: 'https://cf.shopee.vn/file/sg-11134201-8259i-mv9y4tgfrea045',
    images: ['https://cf.shopee.vn/file/sg-11134201-8259i-mv9y4tgfrea045'],
    variation_group: '',
    min_price: 24000, max_price: 24000, total_stock: 100, weight: 150,
    variants: [
      { variation_name: '', price: 24000, stock: 100 },
    ]
  },
  {
    shopee_id: '50971366848', sku: '',
    name: 'Bộ Chú Tiểu Tứ Không Trang Trí Để Bàn',
    slug: 'bo-chu-tieu-tu-khong-trang-tri-de-ban',
    description: `Bộ 4 chú tiểu gốm sứ tứ không (không nghe, không nhìn, không nói, không biết) dễ thương trang trí để bàn. Chất liệu gốm sứ cao cấp. Phù hợp làm quà tặng độc đáo.`,
    category_slug: 'phong-thuy',
    cover_image: 'https://cf.shopee.vn/file/vn-11134201-81ztc-mqkk377j1xqk86',
    images: ['https://cf.shopee.vn/file/vn-11134201-81ztc-mqkk377j1xqk86'],
    variation_group: '',
    min_price: 42000, max_price: 42000, total_stock: 20, weight: 200,
    variants: [
      { variation_name: '', price: 42000, stock: 20 },
    ]
  },
  {
    shopee_id: '41082518356', sku: '',
    name: 'Kệ Đèn Decor Mini Để Bàn Rộng 12cm Cao 15cm Phong Cách Tinh Tế',
    slug: 'ke-den-decor-mini-de-ban-rong-12cm-cao-15cm-phong-cach-tinh-te',
    description: `Kệ đèn decor mini để bàn, kích thước rộng 12cm cao 15cm. Phong cách tối giản, tinh tế. Chất liệu gỗ và kim loại. Phù hợp đặt sách, nến, hoa mini trang trí góc bàn làm việc.`,
    category_slug: 'trang-tri-noi-that',
    cover_image: 'https://cf.shopee.vn/file/vn-11134201-81ztc-mqkk5r5zgop82b',
    images: ['https://cf.shopee.vn/file/vn-11134201-81ztc-mqkk5r5zgop82b'],
    variation_group: 'Màu',
    min_price: 178000, max_price: 179000, total_stock: 222, weight: 400,
    variants: [
      { variation_name: 'Màu tự nhiên', price: 178000, stock: 111 },
      { variation_name: 'Màu đen', price: 179000, stock: 111 },
    ]
  },
];

export function seedDatabase() {
  const db = getDb();
  
  // Check if already seeded
  const categoryCount = (db.prepare('SELECT COUNT(*) as count FROM categories').get() as any).count;
  if (categoryCount > 0) return;
  
  console.log('Seeding database...');
  
  // Insert categories
  const insertCategory = db.prepare(
    'INSERT INTO categories (name, slug, description, sort_order) VALUES (?, ?, ?, ?)'
  );
  
  for (const cat of CATEGORIES) {
    insertCategory.run(cat.name, cat.slug, cat.description, cat.sort_order);
  }
  
  // Get category map
  const categories = db.prepare('SELECT id, slug FROM categories').all() as any[];
  const catMap = Object.fromEntries(categories.map(c => [c.slug, c.id]));
  
  // Insert products
  const insertProduct = db.prepare(`
    INSERT INTO products (shopee_id, sku, name, slug, description, category_id, cover_image, images, 
      variation_group, min_price, max_price, total_stock, weight, is_active, is_featured, is_new, is_hot, shopee_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)
  `);
  
  const insertVariant = db.prepare(`
    INSERT INTO product_variants (product_id, variation_name, price, stock, image, is_active)
    VALUES (?, ?, ?, ?, ?, 1)
  `);
  
  for (const p of PRODUCTS_DATA) {
    const catId = catMap[p.category_slug] || catMap['khac'];
    const shopeeUrl = `https://shopee.vn/product/${p.shopee_id}`;
    
    const result = insertProduct.run(
      p.shopee_id, p.sku || '', p.name, p.slug, p.description,
      catId, p.cover_image, JSON.stringify(p.images),
      p.variation_group || '',
      p.min_price, p.max_price, p.total_stock, p.weight || 500,
      p.is_featured ? 1 : 0, p.is_new ? 1 : 0, p.is_hot ? 1 : 0,
      shopeeUrl
    );
    
    const productId = result.lastInsertRowid;
    
    for (const v of p.variants) {
      insertVariant.run(productId, v.variation_name || '', v.price, v.stock, (v as any).image || '');
    }
  }
  
  // Insert sample coupon
  db.prepare(`
    INSERT INTO coupons (code, type, value, min_order, max_uses) VALUES (?, ?, ?, ?, ?)
  `).run('WELCOME10', 'percent', 10, 100000, 100);
  
  // Insert settings
  const insertSetting = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  insertSetting.run('shop_name', 'CHILL HANDMADE DECOR');
  insertSetting.run('shop_phone', '0779892553');
  insertSetting.run('shop_address', 'Tân Phú, Quận 9, TP. Thủ Đức, TP. HCM');
  insertSetting.run('shop_email', 'Men7a3@gmail.com');
  insertSetting.run('shipping_fee', '30000');
  insertSetting.run('free_shipping_threshold', '500000');
  insertSetting.run('payment_cod', '1');
  insertSetting.run('payment_bank', '1');
  insertSetting.run('bank_name', 'SACOMBANK');
  insertSetting.run('bank_account', '070112045781');
  insertSetting.run('bank_owner', 'LE HOAI MEN');
  
  console.log('Database seeded successfully!');
}

