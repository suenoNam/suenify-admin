"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Link2,
  ScrollText,
  Server,
  Circle,
} from "lucide-react";
import {
  getMergedServiceRegistry,
  getServiceById,
} from "@/lib/services/registry";
import { getStatusCards } from "@/lib/status/cards";
import type { RecentLogItem } from "@/components/settings/RecentLogsPanel";
import { fetchNasStatus, type NasStatusData } from "@/lib/status/nas";

type Props = {
  recentLogs: RecentLogItem[];
  onOpenService: (serviceId: string) => void;
};

function 카드섹션({
  아이콘,
  제목,
  children,
}: {
  아이콘: React.ReactNode;
  제목: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl bg-white/5 p-6">
      <div className="flex items-center gap-3">
        <span className="text-slate-300">{아이콘}</span>
        <h3 className="text-lg font-semibold text-slate-100">
          {제목}
        </h3>
      </div>

      <div className="mt-5">{children}</div>
    </section>
  );
}

function 정보그리드({
  항목들,
}: {
  항목들: Array<{ 라벨: string; 값: string }>;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {항목들.map((항목) => (
        <div
          key={항목.라벨}
          className="rounded-2xl border border-white/10 bg-black/20 p-4"
        >
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
            {항목.라벨}
          </p>
          <p className="mt-2 break-words text-sm text-slate-200">
            {항목.값 || "-"}
          </p>
        </div>
      ))}
    </div>
  );
}

function 상태핀({
  상태,
}: {
  상태: "정상" | "오류" | "확인 전";
}) {
  const className =
    상태 === "정상"
      ? "text-emerald-400"
      : 상태 === "오류"
      ? "text-red-400"
      : "text-slate-500";

  return (
    <Circle
      size={10}
      className={className}
      fill="currentColor"
    />
  );
}

export default function NasChecklistPanel({
  recentLogs,
  onOpenService,
}: Props) {
  const nas = getServiceById("nas");

  const [nasData, setNasData] = useState<NasStatusData>({
  서버상태: "확인 중",
  외부주소: "-",
  내부주소: "-",
  저장소사용률: "-",
  CPU사용률: "-",
  RAM사용률: "-",
  총저장공간: "-",
  현재사용량: "-",
  업데이트시간: "-",
});

  useEffect(() => {
  async function loadNasData() {
    const data = await fetchNasStatus();
    setNasData(data);
  }

  loadNasData();
}, []);

  const 전체서비스 = getMergedServiceRegistry().filter(
    (service) =>
      service.enabled &&
      service.id !== "nas"
  );

  const 상태카드목록 = useMemo(
    () => getStatusCards(),
    []
  );

  const 상태맵 = useMemo(() => {
    const map = new Map<
      string,
      "정상" | "오류" | "확인 전"
    >();

    상태카드목록.forEach((card) => {
      if (card.type === "online") {
        map.set(card.id, "정상");
      } else if (
        card.type === "error" ||
        card.type === "offline"
      ) {
        map.set(card.id, "오류");
      } else {
        map.set(card.id, "확인 전");
      }
    });

    return map;
  }, [상태카드목록]);

  const 최근중요로그 = recentLogs.slice(0, 5);

  const 저장공간1 =
    nasData.저장공간1 &&
    nasData.저장공간1.총저장공간 &&
    nasData.저장공간1.현재사용량 &&
    nasData.저장공간1.저장소사용률
      ? `${nasData.저장공간1.총저장공간} / ${nasData.저장공간1.현재사용량} 사용 / ${nasData.저장공간1.저장소사용률}`
      : nasData.총저장공간 && nasData.현재사용량 && nasData.저장소사용률
      ? `${nasData.총저장공간} / ${nasData.현재사용량} 사용 / ${nasData.저장소사용률}`
      : "-";

  const 저장공간2 =
    nasData.저장공간2 &&
    nasData.저장공간2.총저장공간 &&
    nasData.저장공간2.현재사용량 &&
    nasData.저장공간2.저장소사용률 &&
    nasData.저장공간2.총저장공간 !== "-"
      ? `${nasData.저장공간2.총저장공간} / ${nasData.저장공간2.현재사용량} 사용 / ${nasData.저장공간2.저장소사용률}`
      : "-";

  return (
    <div className="space-y-6">
      <카드섹션
        아이콘={<Link2 size={18} />}
        제목="상세 정보"
      >
        <정보그리드
  항목들={[
    {
      라벨: "외부 주소",
      값: nasData.외부주소 || "-",
    },
    {
      라벨: "내부 주소",
      값: nasData.내부주소 || "-",
    },

    {
      라벨: "서버 상태",
      값: nasData.서버상태 || "-",
    },
    {
      라벨: "마지막 업데이트",
      값: nasData.업데이트시간 || "-",
    },

    {
      라벨: "CPU",
      값: nasData.CPU사용률 || "-",
    },
    {
      라벨: "RAM",
      값: nasData.RAM사용률 || "-",
    },

    {
      라벨: "저장공간 1",
      값: 저장공간1,
    },
    ...(저장공간2 !== "-"
      ? [
          {
            라벨: "저장공간 2",
            값: 저장공간2,
          },
        ]
      : []),

    {
      라벨: "메모",
      값: String(nas?.note || "").trim() || "-",
    },
  ]}
/>
      </카드섹션>
    </div>
  );
}