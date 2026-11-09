---
name: classic-luxury-ui
description: Thiết kế giao diện phong cách Châu Âu cổ điển sang trọng (Classic Luxury), tối ưu riêng cho các sản phẩm decor gốm gỗ, thác nước phong thủy thủ công. Đảm bảo hỗ trợ tiếng Việt 100% không lỗi font và có độ tương phản cao trên nền tối.
---

# Quy Chuẩn Giao Diện Classic Luxury Châu Âu (Dành Cho Trang Trí Gốm Gỗ)

## 1. Tuyên Ngôn Thiết Kế (Design Philosophy)
Tạo ra giao diện web/app mang lại cảm giác của một không gian triển lãm nghệ thuật Châu Âu cao cấp hoặc showroom đồ thủ công xa xỉ. Giao diện kết hợp giữa tính đối xứng, tỉ lệ vàng cổ điển và chất nghệ thuật trầm tĩnh của gốm sứ nung, gỗ tự nhiên và dòng chảy thác nước phong thủy. 

## 2. Bảng Màu Thượng Lưu & Độ Tương Phản Cao (High-Contrast Luxury Palette)
Tuyệt đối không dùng màu xám quá tối gây khó đọc hoặc màu neon gắt. Áp dụng bảng màu nền tối thượng lưu với độ tương phản cao (WCAG AAA):

- **Nền chủ đạo (Dominant Background):** Đen mun trầm (`#0F0D0A`) hoặc Đen mộc sẫm (`#161412`).
- **Nền thẻ / Khung (Surface/Card):** Nền nâu trầm cổ điển (`#1E1A15`) hoặc Gỗ Mun gụ (`#231F1A`).
- **Màu nhấn Vàng Kim (Metallic Gold Accent):** Vàng kim rực rỡ (`#E6B800`), Vàng Gold Hoàng Gia (`#D4AF37`) phủ metallic gradient nhẹ.
- **Màu chữ hiển thị (Text - Anti-Tiệp Nền):**
  - **Tiêu đề / Tên sản phẩm:** Trắng ngà ngọc trai (`#FDFBF7`) – Nổi bật hoàn toàn trên nền tối.
  - **Nội dung / Thông số kho:** Kem sáng cổ điển (`#E2D9CC` hoặc `#D1C7B7`) – Rõ nét, không gây mỏi mắt.
  - **Giá tiền:** Vàng kim sáng rực (`#E6B800` hoặc `#FFD700`) font nét đậm (Extrabold).
- **Màu bổ trợ phong thủy:** Xanh ngọc bảo nhạt (`#0A4D3C`), Đỏ gạch nung (`#8C3A27`).

## 3. Nghệ Thuật Chữ Tiếng Việt Chuẩn (Vietnamese Typography)
Bắt buộc cấu hình `subsets: ['vietnamese']` để tránh tuyệt đối lỗi tách khoảng trắng bất thường hoặc rớt dấu tiếng Việt.

- **Tiêu đề chính (Headings - H1, H2, H3, Tên sản phẩm):**
  - Ưu tiên font Serif có chân sang trọng: **Playfair Display** hoặc **Cormorant Garamond**.
  - Quy tắc: Viết hoa tiêu đề chính (UPPERCASE), căn giữa đối xứng, kết hợp `letter-spacing: 0.08em` để tạo khoảng thở đẳng cấp.
- **Văn bản & Thông số (Body Text, Giá tiền, Kho hàng):**
  - Ưu tiên font Sans-serif sắc nét, hiện đại: **Plus Jakarta Sans** hoặc **Be Vietnam Pro**.
  - Quy tắc: Chữ nét rõ, căn chỉnh độ tương phản chuẩn để khách hàng quan sát dễ dàng trên mobile và desktop.

## 4. Bố Cục & Đường Nét (Layout & Ornaments)
- **Tính đối xứng trục (Symmetry):** Căn giữa (Center Alignment) làm gốc cho phần Hero Banner, Tiêu đề bộ sưu tập và các nút bấm chính.
- **Đường viền mạ kim (Gold Borders):** Dùng đường viền mảnh `1px` sắc nét màu vàng kim trầm (`#4A3E2D` hoặc `#E6B800`/30%) để tách biệt các thẻ sản phẩm khỏi nền đen.
- **Khung viền đôi cổ điển (Double Borders):** Ảnh đại diện thác nước/chậu gốm được lồng trong khung kép (viền ngoài mảnh màu vàng gold, viền trong chìm) tạo cảm giác như một bức tranh nghệ thuật.
- **Khoảng trắng quyền lực (Negative Space):** Giữ tỷ lệ khoảng trống từ 30-40% giúp sản phẩm gốm gỗ nâng cao giá trị độc bản.

## 5. Hiệu Ứng Thị Giác & Chất Liệu (Visual & Texture)
- **Hình ảnh sản phẩm:** Ảnh chụp rõ nét ánh đèn vàng ấm, tạo độ bóng mờ nghệ thuật (Warm Glow Shadow) cho chất liệu gốm men sôi, dòng nước và gỗ tự nhiên.
- **Chất liệu ánh kim (Metallic Glow):** Nút bấm và các thẻ huy hiệu (`HOT`, `HANDMADE CAO CẤP`) phủ hiệu ứng viền vàng ánh kim mờ khi hover.
- **Chuyển động từ tốn (Micro-interactions):** Hiệu ứng zoom ảnh sản phẩm và xuất hiện thông tin nhẹ nhàng mượt mà (`transition: all 0.5s cubic-bezier(0.25, 1, 0.5, 1)`).

## 6. Cấu Trúc Thành Phần Mẫu (UI Component Specs - Next.js & Tailwind CSS)

### Thẻ Sản Phẩm Luxury (Product Card)
```tsx
export default function LuxuryProductCard({ product }) {
  return (
    <div className="group relative border border-[#4A3E2D] bg-[#161412] p-5 rounded-none transition-all duration-500 hover:border-[#E6B800] hover:shadow-[0_8px_30px_rgba(230,184,0,0.15)]">
      {/* Khung viền kép cho ảnh */}
      <div className="relative aspect-[4/5] w-full overflow-hidden border border-[#3A3022] p-1">
        <div className="relative h-full w-full overflow-hidden">
          <img 
            src={product.image} 
            alt={product.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" 
          />
        </div>
        {product.isHot && (
          <span className="absolute left-3 top-3 bg-[#0F0D0A]/90 border border-[#E6B800] px-3 py-1 font-serif text-[10px] font-bold tracking-widest text-[#E6B800] uppercase">
            HOT
          </span>
        )}
      </div>

      {/* Thông tin sản phẩm tương phản cao */}
      <div className="mt-5 text-center">
        <span className="font-serif text-[11px] tracking-widest text-[#E6B800] uppercase">
          {product.category || "PHONG THỦY"}
        </span>
        <h3 className="mt-1 font-serif text-lg font-bold text-[#FDFBF7] transition-colors group-hover:text-[#E6B800] line-clamp-2 leading-snug">
          {product.title}
        </h3>
        
        <div className="mt-3 flex items-center justify-center gap-3">
          <p className="font-sans text-xl font-extrabold text-[#E6B800] tracking-wide">
            {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(product.price)}
          </p>
          {product.stock && (
            <span className="font-sans text-xs text-[#D1C7B7]">
              Kho: {product.stock}
            </span>
          )}
        </div>

        {/* Nút bấm Classic Luxury */}
        <button className="mt-4 w-full border border-[#E6B800] bg-[#1E1A15] py-2.5 font-sans text-xs font-bold uppercase tracking-widest text-[#FDFBF7] transition-all duration-300 hover:bg-[#E6B800] hover:text-[#0F0D0A]">
          Xem Chi Tiết
        </button>
      </div>
    </div>
  );
}