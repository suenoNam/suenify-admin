"use client";

import type { ViewType } from "@/lib/status/types";

type FloatingPathProps = {
  activeView: ViewType;
};

function getPathLabel(view: ViewType) {
  switch (view) {
    case "dashboard":
      return "홈";
    case "nas":
      return "서비스 / NAS";
    case "jellyfin":
      return "서비스 / Jellyfin";
    case "main-domain":
      return "서비스 / Main Domain";
    case "api-deploy":
      return "서비스 / API & Deploy";
    case "settings-services":
      return "설정 / 서비스 설정";
    case "settings-dashboard":
      return "설정 / 대시보드 설정";
    case "settings-account":
      return "설정 / 계정 설정";
    case "settings-logs":
      return "설정 / 로그";
    default:
      return "홈";
  }
}

export default function FloatingPath({ activeView }: FloatingPathProps) {
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-9990 rounded-full border border-white/10 bg-slate-950/80 px-4 py-2 text-xs text-slate-300 shadow-xl backdrop-blur">
      {getPathLabel(activeView)}
    </div>
  );
}