// 콤보·사각형 보너스·섞는 중 알림
export default function Banner({ banner }) {
  return (
    <div className={`banner${banner ? ' show' : ''}`} key={banner?.key}>
      {banner?.text}
    </div>
  );
}
