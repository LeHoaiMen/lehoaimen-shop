// app/chinh-sach-van-chuyen/page.tsx
export default function ShippingPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white mb-6">
        Chính Sách Vận Chuyển & Giao Nhận
      </h1>
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4 text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
        <h3 className="text-base font-bold text-zinc-900 dark:text-white">1. Thời gian giao hàng</h3>
        <p>• Khu vực TP. Hồ Chí Minh & TP. Thủ Đức: 1 - 2 ngày làm việc (có hỗ trợ hỏa tốc trong ngày qua Grab/Ahamove khi đặt qua Zalo).</p>
        <p>• Các tỉnh thành miền Nam, miền Trung, miền Bắc: 2 - 4 ngày làm việc.</p>

        <h3 className="text-base font-bold text-zinc-900 dark:text-white pt-2">2. Cước phí vận chuyển</h3>
        <p>• Cước phí tiêu chuẩn toàn quốc: 30.000 VNĐ / đơn hàng.</p>
        <p>• <strong>Miễn phí vận chuyển (Freeship)</strong> cho mọi đơn hàng có giá trị từ 500.000 VNĐ trở lên.</p>

        <h3 className="text-base font-bold text-zinc-900 dark:text-white pt-2">3. Kiểm tra hàng trước khi nhận (Đồng kiểm)</h3>
        <p>
          Khách hàng được mở gói hàng kiểm tra ngoại quan (không nứt vỡ, đúng phân loại mẫu mã, đầy đủ bơm và phụ kiện) trước khi thanh toán cho shipper.
        </p>
      </div>
    </div>
  );
}

