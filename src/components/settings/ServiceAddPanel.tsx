"use client";

import { useState } from "react";
import {
  addUserService,
  type ServiceRegistryItem,
} from "@/lib/services/registry";

type Props = {
  onAdded: () => void;
};

function isValidIpv4(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return true;

  const ipv4Regex =
    /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;

  return ipv4Regex.test(trimmed);
}

export default function ServiceAddPanel({ onAdded }: Props) {
  const [title, setTitle] = useState("");
  const [internalIp, setInternalIp] = useState("");
  const [internalUrl, setInternalUrl] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [placement, setPlacement] = useState<"main" | "sub">("sub");
  const [icon, setIcon] = useState("server");
  const [serviceKind, setServiceKind] = useState<
    "nas" | "media" | "domain" | "api" | "other"
  >("other");

  function createServiceId(title: string) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  function handleAdd() {
    const trimmedTitle = title.trim();
    const trimmedInternalIp = internalIp.trim();
    const trimmedInternalUrl = internalUrl.trim();
    const trimmedExternalUrl = externalUrl.trim();

    if (!trimmedTitle) return;

    if (!isValidIpv4(trimmedInternalIp)) {
      alert("내부 IP는 IPv4 형식으로 입력하세요. 예: 192.168.0.44");
      return;
    }

    const primaryMode: "internal" | "external" = trimmedExternalUrl
      ? "external"
      : "internal";

    const monitorMode: "direct" | "internal-api" = "direct";

    const newService: ServiceRegistryItem = {
      id: createServiceId(trimmedTitle),
      title: trimmedTitle,
      icon,
      adminGroup: "services",
      internalUrl: trimmedInternalUrl,
      externalUrl: trimmedExternalUrl,
      primary: primaryMode,
      description: trimmedTitle,
      serviceKind,
      placement,
      enabled: true,
      monitoringEnabled: true,
      monitorMode,
      note: "",
      accessInfo: "",
      ruleSummary: "사용자 추가 서비스",
      pendingDetail: `${trimmedTitle} 연결 준비중`,
      metricA: "",
      metricB: "",
      metadata: {
        internalIp: trimmedInternalIp,
        lastCheckedUrl: trimmedExternalUrl || trimmedInternalUrl || "",
      },
      settingsFields: [
        { key: "title", label: "서비스 이름", type: "text" },
        { key: "description", label: "설명", type: "text" },
        { key: "internalIp", label: "내부 IP", type: "text" },
        { key: "internalUrl", label: "내부 주소", type: "text" },
        { key: "externalUrl", label: "외부 주소", type: "text" },
        { key: "primary", label: "기본 체크 기준", type: "select" },
        { key: "placement", label: "구분", type: "select" },
        { key: "serviceKind", label: "서비스 종류", type: "select" },
        { key: "note", label: "메모", type: "text" },
        { key: "accessInfo", label: "접속 정보", type: "text" },
        { key: "ruleSummary", label: "체크 기준", type: "text" },
      ],
    };

    try {
      addUserService(newService);

      setTitle("");
      setInternalIp("");
      setInternalUrl("");
      setExternalUrl("");
      setPlacement("sub");
      setServiceKind("other");
      setIcon("server");

      onAdded();
    } catch (error) {
      console.error(error);
      alert("같은 이름의 서비스가 이미 존재합니다.");
    }
  }

  return (
    <div>
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-500">
            서비스 이름
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="서비스 이름"
            className="w-full rounded-xl bg-black/20 px-3 py-2 text-sm text-white"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-500">
            구분
          </label>
          <select
            value={placement}
            onChange={(e) => setPlacement(e.target.value as "main" | "sub")}
            className="w-full rounded-xl bg-black/20 px-3 py-2 text-sm text-white"
          >
            <option value="sub">서브</option>
            <option value="main">메인</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-500">
            서비스 종류
          </label>
          <select
            value={serviceKind}
            onChange={(e) =>
              setServiceKind(
                e.target.value as "nas" | "media" | "domain" | "api" | "other"
              )
            }
            className="w-full rounded-xl bg-black/20 px-3 py-2 text-sm text-white"
          >
            <option value="other">기타</option>
            <option value="nas">NAS</option>
            <option value="media">미디어</option>
            <option value="domain">도메인</option>
            <option value="api">API</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-500">
            아이콘 선택
          </label>
          <select
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            className="w-full rounded-xl bg-black/20 px-3 py-2 text-sm text-white"
          >
            <option value="server">서버</option>
            <option value="hard-drive">NAS</option>
            <option value="film">미디어</option>
            <option value="globe">도메인</option>
            <option value="boxes">박스/API</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-500">
            외부 주소
          </label>
          <input
            value={externalUrl}
            onChange={(e) => setExternalUrl(e.target.value)}
            placeholder="외부 주소"
            className="w-full rounded-xl bg-black/20 px-3 py-2 text-sm text-white"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-500">
            내부 주소
          </label>
          <input
            value={internalUrl}
            onChange={(e) => setInternalUrl(e.target.value)}
            placeholder="예: http://192.168.0.44:3000"
            className="w-full rounded-xl bg-black/20 px-3 py-2 text-sm text-white"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-500">
            내부 IP
          </label>
          <input
            value={internalIp}
            onChange={(e) => setInternalIp(e.target.value)}
            placeholder="예: 192.168.0.44"
            className="w-full rounded-xl bg-black/20 px-3 py-2 text-sm text-white"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={handleAdd}
        className="mt-4 rounded-xl bg-white/10 px-4 py-2 text-sm hover:bg-white/20"
      >
        서비스 추가
      </button>
    </div>
  );
}