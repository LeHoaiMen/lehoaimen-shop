// app/dieu-khoan-su-dung/page.tsx
export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white mb-6">
        Điều Khoản Dịch Vụ
      </h1>
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4 text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
        <h3 className="text-base font-bold text-zinc-900 dark:text-white">1. Chấp thuận điều khoản</h3>
        <p>Khi đặt hàng trên website của chúng tôi, quý khách đồng ý tuân thủ các quy định và hướng dẫn thanh toán, nhận hàng theo cam kết.</p>

        <h3 className="text-base font-bold text-zinc-900 dark:text-white pt-2">2. Tính chất hàng thủ công</h3>
        <p>
          Các tác phẩm thác nước phong thủy và chậu gốm được làm thủ công bằng tay (handmade). Kích thước thực tế có thể chênh lệch khoảng 0.5 - 1cm và sắc độ màu men nung có thể có sự biến ảo tự nhiên nhẹ, tạo nên nét đẹp độc bản của từng sản phẩm.
        </p>

        <h3 className="text-base font-bold text-zinc-900 dark:text-white pt-2">3. Hướng dẫn an toàn thiết bị điện</h3>
        <p>
          Bơm mini sử dụng điện áp an toàn 5V qua cổng sạc USB hoặc adapter 220V đi kèm. Vui lòng luôn đảm bảo chậu có đủ nước ngập máy bơm trước khi cắm điện để bảo vệ tuổi thọ của motor.
        </p>
      </div>
    </div>
  );
}

