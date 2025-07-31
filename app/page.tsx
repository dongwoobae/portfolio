import Image from "next/image";

export default function Home() {
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <div>
        배동우 포트폴리오
      </div>
      <div>
        이미지
      </div>
      <div>
        프로젝트 설명
      </div>
    </div>
  );
}
