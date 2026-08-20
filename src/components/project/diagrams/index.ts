import type { ComponentType } from "react";
import type { DiagramId } from "@/content/projects/diagrams";
import { CouponMallInfra } from "./CouponMallInfra";
import { CouponMallQueue } from "./CouponMallQueue";
import { SumgimBlur } from "./SumgimBlur";
import { WorldengReservation } from "./WorldengReservation";
import { YccQstash } from "./YccQstash";
import { YccWebsub } from "./YccWebsub";

export type DiagramProps = { titleId: string; descId: string };

// Record<DiagramId, ...>라서 id를 늘리고 컴포넌트를 안 만들면 타입 검사가 깨진다.
export const DIAGRAMS: Record<DiagramId, ComponentType<DiagramProps>> = {
  "ycc-websub": YccWebsub,
  "ycc-qstash": YccQstash,
  "sumgim-blur": SumgimBlur,
  "worldeng-reservation": WorldengReservation,
  "coupon-mall-queue": CouponMallQueue,
  "coupon-mall-infra": CouponMallInfra,
};
