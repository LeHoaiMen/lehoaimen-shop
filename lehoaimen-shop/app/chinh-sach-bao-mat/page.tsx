// app/chinh-sach-bao-mat/page.tsx
export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white mb-6">
        Chính Sách Bảo Mật Thông Tin
      </h1>
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4 text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
        <h3 className="text-base font-bold text-zinc-900 dark:text-white">1. Mục đích thu thập thông tin</h3>
        <p>Chúng tôi chỉ thu thập họ tên, số điện thoại, địa chỉ và ghi chú giao hàng nhằm mục đích gửi hàng và bảo hành sản phẩm cho quý khách.</p>

        <h3 className="text-base font-bold text-zinc-900 dark:text-white pt-2">2. Phạm vi sử dụng</h3>
        <p>Thông tin chỉ được sử dụng nội bộ tại xưởng Lê Hoài Mến và chuyển giao cho đơn vị vận chuyển (Viettel Post, GHTK, SPX) để thực hiện giao nhận bưu kiện.</p>

        <h3 className="text-base font-bold text-zinc-900 dark:text-white pt-2">3. Cam kết bảo mật</h3>
        <p>Tuyệt đối không chia sẻ, mua bán thông tin khách hàng cho bên thứ ba vì bất kỳ mục đích thương mại nào khác.</p>
      </div>
    </div>
  );
}

