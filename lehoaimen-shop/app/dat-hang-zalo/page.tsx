'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, ExternalLink, MessageCircle, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCartStore } from '@/store/cartStore';
import { formatPrice } from '@/lib/utils';

type ZaloInfo = {enabled:boolean;orderEnabled:boolean;url:string};
export default function ZaloOrderPage() {
  const router=useRouter();
  const {items,getTotalPrice}=useCartStore();
  const [authorized,setAuthorized]=useState(false);
  const [config,setConfig]=useState<ZaloInfo|null>(null);
  const [submitting,setSubmitting]=useState(false);
  const [reference,setReference]=useState('');
  const [requestMessage,setRequestMessage]=useState('');

  useEffect(()=>{
    fetch('/api/account/session').then(async res=>{
      if(!res.ok){toast('Vui lòng đăng nhập hoặc đăng ký tài khoản để tiếp tục đặt hàng và theo dõi đơn hàng của bạn.');router.replace('/dang-nhap?next=%2Fdat-hang-zalo');return;}
      setAuthorized(true);
    }).catch(()=>toast.error('Không thể kiểm tra đăng nhập'));
    fetch('/api/store/zalo').then(res=>res.json()).then(setConfig).catch(()=>setConfig({enabled:false,orderEnabled:false,url:''}));
  },[router]);

  async function createAndOpen() {
    if(!config?.orderEnabled)return toast.error('Cửa hàng chưa bật đặt hàng qua Zalo.');
    if(!items.length)return toast.error('Giỏ hàng đang trống.');
    const zaloWindow=window.open('about:blank','_blank');
    if(reference&&requestMessage){if(zaloWindow)zaloWindow.location.href=config.url;else window.location.assign(config.url);await Promise.resolve().then(()=>navigator.clipboard.writeText(requestMessage)).catch(()=>undefined);return;}
    setSubmitting(true);
    try{
      const res=await fetch('/api/account/zalo-requests',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items:items.map(item=>({product_id:item.product_id,variant_id:item.variant_id,quantity:item.quantity})),coupon_code:sessionStorage.getItem('checkout-coupon')||''})});
      const data=await res.json();
      if(res.status===401){router.replace('/dang-nhap?next=%2Fdat-hang-zalo');throw new Error(data.error||'Vui lòng đăng nhập lại.');}
      if(!res.ok)throw new Error(data.error||'Không tạo được yêu cầu');
      setReference(data.reference);
      setRequestMessage(data.message);
      const copied=await Promise.resolve().then(()=>navigator.clipboard.writeText(data.message)).then(()=>true).catch(()=>false);
      if(zaloWindow)zaloWindow.location.href=data.zaloUrl;
      else window.location.assign(data.zaloUrl);
      if(copied)toast.success('Đã tạo yêu cầu và sao chép nội dung. Hãy dán rồi gửi tin nhắn trong Zalo.');
      else toast.success('Đã tạo yêu cầu. Hãy sao chép nội dung bên dưới và gửi trong Zalo.');
    }catch(error){zaloWindow?.close();toast.error(error instanceof Error?error.message:'Không thể mở Zalo');}
    finally{setSubmitting(false);}
  }

  if(!authorized)return <main className="min-h-[60vh] grid place-items-center text-zinc-500">Đang kiểm tra tài khoản…</main>;
  if(!config)return <main className="p-16 text-center">Đang tải cấu hình Zalo…</main>;
  if(!config.orderEnabled)return <main className="mx-auto max-w-2xl px-4 py-20 text-center"><MessageCircle className="mx-auto text-zinc-300" size={42}/><h1 className="mt-5 text-2xl font-black">Đặt hàng qua Zalo chưa khả dụng</h1><p className="mt-2 text-sm text-zinc-500">Cửa hàng chưa cấu hình liên kết Zalo chính thức.</p><Link href="/gio-hang" className="mt-6 inline-flex rounded-xl bg-amber-600 px-5 py-3 text-sm font-bold text-white">Quay lại giỏ hàng</Link></main>;
  return <main className="classic-luxury min-h-[65vh] bg-zinc-50 dark:bg-zinc-950"><div className="mx-auto max-w-3xl px-4 py-10"><Link href="/gio-hang" className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500"><ArrowLeft size={16}/> Quay lại giỏ hàng</Link><section className="mt-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-9"><div className="flex items-start gap-4"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-sky-100 text-sky-700"><MessageCircle/></div><div><p className="text-xs font-bold uppercase tracking-[.18em] text-sky-700">Tư vấn trực tiếp</p><h1 className="mt-1 text-2xl font-black">Đặt hàng qua Zalo</h1><p className="mt-2 text-sm text-zinc-500">Thông tin khách và sản phẩm sẽ được điền sẵn vào tin nhắn để bạn gửi cho cửa hàng.</p></div></div><div className="mt-7 divide-y divide-zinc-100 dark:divide-zinc-800">{items.map((item,index)=><div key={`${item.product_id}-${item.variant_id||0}`} className="flex justify-between gap-4 py-3"><div><p className="font-bold">{index+1}. {item.product_name}</p><p className="mt-1 text-xs text-zinc-500">{item.variant_name||'Mặc định'} · SL {item.quantity}</p></div><p className="shrink-0 text-sm font-bold">{formatPrice(item.price*item.quantity)}</p></div>)}</div><div className="flex justify-between border-t border-zinc-200 pt-4 text-lg font-black"><span>Tổng dự kiến</span><span className="text-amber-700">{formatPrice(getTotalPrice())}</span></div><div className="mt-6 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200"><p className="flex items-center gap-2 font-bold"><ShieldCheck size={17}/> Yêu cầu chỉ được ghi nhận khi cửa hàng xác nhận</p><p className="mt-1 text-xs leading-5">Mở Zalo không đồng nghĩa tin nhắn đã được gửi. Vui lòng dán nội dung đã sao chép và nhấn gửi. Sản phẩm chưa được giữ tồn kho.</p></div>{reference&&<><p className="mt-4 text-center text-sm font-bold text-emerald-700">Mã tham chiếu: {reference}</p><textarea readOnly value={requestMessage} className="mt-4 min-h-48 w-full rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs leading-5 dark:border-zinc-700 dark:bg-zinc-800" aria-label="Nội dung tin nhắn đặt hàng"/></>}<button onClick={createAndOpen} disabled={submitting||items.length===0} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-600 py-4 font-extrabold text-white shadow-lg shadow-sky-600/20 transition hover:-translate-y-0.5 hover:bg-sky-500 disabled:opacity-60"><span>{submitting?'Đang tạo yêu cầu…':reference?'Mở lại Zalo':'Tạo nội dung và mở Zalo'}</span><ExternalLink size={17}/></button></section></div></main>;
}
