// app/chinh-sach-doi-tra/page.tsx
export default function ReturnPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white mb-6">
        Chính Sách Đổi Trả & Hoàn Tiền
      </h1>
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4 text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
        <h3 className="text-base font-bold text-zinc-900 dark:text-white">1. Cam kết bể vỡ trong quá trình vận chuyển</h3>
        <p>
          Do sản phẩm là gốm sứ thủ công nghệ thuật, xưởng Lê Hoài Mến đóng gói tiêu chuẩn 5 lớp màng xốp khí và thùng carton cứng. 
          Quý khách được <strong>đồng kiểm mở hàng</strong> trước khi nhận. Trong trường hợp phát hiện nứt, mẻ hoặc gãy vỡ, quý khách chỉ cần chụp ảnh/video và thông báo qua Zalo hoặc Hotline <strong>0123.456.789</strong>, shop sẽ <strong>gửi ngay sản phẩm mới 100% miễn phí</strong> hoặc hoàn tiền 100%.
        </p>

        <h3 className="text-base font-bold text-zinc-900 dark:text-white pt-2">2. Đổi trả do không ưng ý</h3>
        <p>
          Trong vòng 7 ngày kể từ ngày nhận hàng, nếu sản phẩm chưa qua sử dụng và còn nguyên vẹn, quý khách có thể gửi trả lại xưởng để đổi sang mẫu mã khác phù hợp hơn.
        </p>

        <h3 className="text-base font-bold text-zinc-900 dark:text-white pt-2">3. Thời gian xử lý hoàn tiền</h3>
        <p>
          Thời gian xử lý hoàn tiền qua số tài khoản ngân hàng từ 1 đến 2 ngày làm việc ngay sau khi xưởng nhận được hàng trả về.
        </p>
      </div>
    </div>
  );
}

