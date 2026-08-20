import type { StaticImageData } from "next/image";
import couponMallArchitecture from "../../../public/screenshots/coupon-mall-architecture.png";
import hmsuHome from "../../../public/screenshots/hmsu-home.png";
import hmsuSearch from "../../../public/screenshots/hmsu-search.png";
import ankangSumgimMobile from "../../../public/screenshots/mobile/ankang-sumgim-mobile.png";
import hmsuMobile from "../../../public/screenshots/mobile/hmsu-mobile.png";
import moduCampusMobile from "../../../public/screenshots/mobile/modu-campus-mobile.png";
import worldengcoMobile from "../../../public/screenshots/mobile/worldengco-mobile.png";
import yccWebsiteMobile from "../../../public/screenshots/mobile/ycc-website-mobile.png";
import moduAdminBuildings from "../../../public/screenshots/modu-admin-buildings.png";
import moduBuildingDetail from "../../../public/screenshots/modu-building-detail.png";
import moduFacilityAdd from "../../../public/screenshots/modu-facility-add.png";
import moduMap from "../../../public/screenshots/modu-map.png";
import moduPolygonDraw from "../../../public/screenshots/modu-polygon-draw.png";
import moduSlope from "../../../public/screenshots/modu-slope.png";
import sumgimAdminDashboard from "../../../public/screenshots/sumgim-admin-dashboard.png";
import sumgimBlurGallery from "../../../public/screenshots/sumgim-blur-gallery.png";
import sumgimCalculator from "../../../public/screenshots/sumgim-calculator.png";
import sumgimHome from "../../../public/screenshots/sumgim-home.png";
import worldengAdminBoard from "../../../public/screenshots/worldeng-admin-board.png";
import worldengAdminBooking from "../../../public/screenshots/worldeng-admin-booking.png";
import worldengAdminStaff from "../../../public/screenshots/worldeng-admin-staff.png";
import worldengHome from "../../../public/screenshots/worldeng-home.png";
import worldengReserve from "../../../public/screenshots/worldeng-reserve.png";
import yccAdminSermons from "../../../public/screenshots/ycc-admin-sermons.png";
import yccHome from "../../../public/screenshots/ycc-home.png";
import yccSermonDetail from "../../../public/screenshots/ycc-sermon-detail.png";

/**
 * 스크린샷을 정적 임포트해 두는 곳. 콘텐츠 파일은 `/screenshots/*.png` 문자열만
 * 들고 있고, 실제 크기는 여기서 온다 — next/image가 임포트 시점에 원본 치수와
 * blurDataURL을 채워주므로 비율을 손으로 적을 일이 없다(적으면 언젠가 어긋난다).
 *
 * 원본 비율을 알아야 스크린샷을 잘라내지 않고 그릴 수 있다. 새 스크린샷을 추가하면
 * 여기에도 한 줄 넣는다 — 빠뜨리면 assets.test.ts가 잡는다.
 */
export const screenshots = {
  "/screenshots/coupon-mall-architecture.png": couponMallArchitecture,
  "/screenshots/hmsu-home.png": hmsuHome,
  "/screenshots/hmsu-search.png": hmsuSearch,
  "/screenshots/modu-admin-buildings.png": moduAdminBuildings,
  "/screenshots/modu-building-detail.png": moduBuildingDetail,
  "/screenshots/modu-facility-add.png": moduFacilityAdd,
  "/screenshots/modu-map.png": moduMap,
  "/screenshots/modu-polygon-draw.png": moduPolygonDraw,
  "/screenshots/modu-slope.png": moduSlope,
  "/screenshots/sumgim-admin-dashboard.png": sumgimAdminDashboard,
  "/screenshots/sumgim-blur-gallery.png": sumgimBlurGallery,
  "/screenshots/sumgim-calculator.png": sumgimCalculator,
  "/screenshots/sumgim-home.png": sumgimHome,
  "/screenshots/worldeng-admin-board.png": worldengAdminBoard,
  "/screenshots/worldeng-admin-booking.png": worldengAdminBooking,
  "/screenshots/worldeng-admin-staff.png": worldengAdminStaff,
  "/screenshots/worldeng-home.png": worldengHome,
  "/screenshots/worldeng-reserve.png": worldengReserve,
  "/screenshots/ycc-admin-sermons.png": yccAdminSermons,
  "/screenshots/ycc-home.png": yccHome,
  "/screenshots/ycc-sermon-detail.png": yccSermonDetail,
  "/screenshots/mobile/ankang-sumgim-mobile.png": ankangSumgimMobile,
  "/screenshots/mobile/hmsu-mobile.png": hmsuMobile,
  "/screenshots/mobile/modu-campus-mobile.png": moduCampusMobile,
  "/screenshots/mobile/worldengco-mobile.png": worldengcoMobile,
  "/screenshots/mobile/ycc-website-mobile.png": yccWebsiteMobile,
} satisfies Record<string, StaticImageData>;

export type ScreenshotPath = keyof typeof screenshots;

export function getScreenshot(path: string): StaticImageData {
  const image = screenshots[path as ScreenshotPath];
  if (!image) throw new Error(`스크린샷 매니페스트에 ${path}가 없다`);
  return image;
}
