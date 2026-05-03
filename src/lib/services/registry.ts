import {
  loadUserServices as loadStoredUserServices,
  saveUserServices as saveStoredUserServices,
  loadServiceOverrides,
  saveServiceOverride,
} from "./storage";

export type AdminGroup = "server" | "services" | "ai" | "api" | "storage";

export type ServiceRegistryItem = {
  id: string;
  title: string;
  icon: string;

  internalUrl?: string;
  externalUrl?: string;
  primary: "internal" | "external";

  description: string;
  serviceKind:
    | "server"
    | "nas"
    | "web"
    | "admin"
    | "media"
    | "domain"
    | "api"
    | "ai"
    | "storage"
    | "other";

  placement: "main" | "sub";
  adminGroup: AdminGroup;

  enabled: boolean;
  monitoringEnabled: boolean;
  monitorMode?: "internal-api" | "direct";

  note?: string;
  accessInfo?: string;
  ruleSummary?: string;
  pendingDetail: string;

  metricA?: string;
  metricB?: string;

  metadata?: {
    internalIp?: string;
    storageUsedPercent?: number;
    responseMs?: number;
    proxyPath?: string;
    proxyTarget?: string;
    lastCheckedUrl?: string;
    lastCheckedAt?: string;
    port?: number;
    model?: string;
  };

  settingsFields?: {
    key: string;
    label: string;
    type: "text" | "number" | "checkbox" | "select";
  }[];
};

const DEFAULT_SERVICE_REGISTRY: ServiceRegistryItem[] = [
  {
    id: "mac-mini",
    title: "Mac mini Server",
    icon: "server",
    internalUrl: "http://192.168.0.218",
    externalUrl: "",
    primary: "internal",
    description: "Suenify 메인 실행 서버",
    serviceKind: "server",
    placement: "main",
    adminGroup: "server",
    enabled: true,
    monitoringEnabled: true,
    monitorMode: "internal-api",
    note: "M4 Mac mini 32GB / 256GB",
    accessInfo: "내부 IP 기준 접속",
    ruleSummary: "Mac mini 서버 응답 및 프로세스 상태 기준",
    pendingDetail: "Mac mini 상태 확인 대기",
    metricA: "192.168.0.218",
    metricB: "Main Server",
    metadata: {
      internalIp: "192.168.0.218",
      lastCheckedUrl: "http://192.168.0.218:3000",
    },
  },
  {
    id: "nas",
    title: "NAS Server",
    icon: "hard-drive",
    internalUrl: "http://192.168.0.44",
    externalUrl: "",
    primary: "internal",
    description: "ASUSTOR NAS 보조 저장소",
    serviceKind: "nas",
    placement: "sub",
    adminGroup: "server",
    enabled: true,
    monitoringEnabled: true,
    monitorMode: "internal-api",
    note: "ASUSTOR AS1102TL",
    accessInfo: "내부 IP 접속",
    ruleSummary: "NAS 접속 및 저장소 상태 기준",
    pendingDetail: "NAS 상태 확인 대기",
    metricA: "192.168.0.44",
    metricB: "Storage Server",
    metadata: {
      internalIp: "192.168.0.44",
      lastCheckedUrl: "http://192.168.0.44",
    },
  },
  {
    id: "suenify-web",
    title: "suenify-web",
    icon: "globe",
    internalUrl: "http://192.168.0.218:3000",
    externalUrl: "",
    primary: "internal",
    description: "Suenify 사용자 서비스",
    serviceKind: "web",
    placement: "main",
    adminGroup: "services",
    enabled: true,
    monitoringEnabled: true,
    monitorMode: "internal-api",
    note: "Next.js + PM2",
    accessInfo: "Mac mini 3000 포트",
    ruleSummary: "Next.js 서비스 응답 기준",
    pendingDetail: "suenify-web 상태 확인 대기",
    metricA: "3000",
    metricB: "PM2",
    metadata: {
      internalIp: "192.168.0.218",
      port: 3000,
      lastCheckedUrl: "http://192.168.0.218:3000",
    },
  },
  {
    id: "suenify-admin",
    title: "suenify-admin",
    icon: "boxes",
    internalUrl: "http://192.168.0.218:3001",
    externalUrl: "",
    primary: "internal",
    description: "Suenify 관리자 페이지",
    serviceKind: "admin",
    placement: "main",
    adminGroup: "services",
    enabled: true,
    monitoringEnabled: true,
    monitorMode: "internal-api",
    note: "Next.js Admin Dashboard",
    accessInfo: "Mac mini 3001 포트 예정",
    ruleSummary: "관리자 페이지 응답 기준",
    pendingDetail: "suenify-admin 상태 확인 대기",
    metricA: "3001",
    metricB: "PM2",
    metadata: {
      internalIp: "192.168.0.218",
      port: 3001,
      lastCheckedUrl: "http://192.168.0.218:3001",
    },
  },
    {
    id: "deploy-server",
    title: "Deploy Server",
    icon: "server",
    internalUrl: "http://localhost:4000",
    externalUrl: "https://deploy.suenify.com",
    primary: "internal",
    description: "GitHub Webhook을 받아 자동 배포를 실행하는 서버",
    serviceKind: "api",
    placement: "main",
    adminGroup: "services",
    enabled: true,
    monitoringEnabled: true,
    monitorMode: "direct",
    note: "admin/web 자동 배포 트리거 서버",
    accessInfo: "Cloudflare Tunnel + GitHub Webhook",
    ruleSummary: "deploy-server HTTP 응답 기준",
    pendingDetail: "Deploy Server 상태 확인 대기",
    metricA: "4000",
    metricB: "Webhook",
    metadata: {
      internalIp: "127.0.0.1",
      port: 4000,
      lastCheckedUrl: "http://localhost:4000",
    },
  },
  {
    id: "jellyfin",
    title: "Jellyfin",
    icon: "film",
    internalUrl: "http://192.168.0.44:28096",
    externalUrl: "https://sueno.myasustor.com/jellyfin",
    primary: "external",
    description: "NAS 미디어 서버",
    serviceKind: "media",
    placement: "sub",
    adminGroup: "services",
    enabled: true,
    monitoringEnabled: true,
    monitorMode: "internal-api",
    note: "NAS에 남겨둘 미디어 서비스",
    accessInfo: "외부 주소 /jellyfin",
    ruleSummary: "Reverse proxy 및 Jellyfin 응답 기준",
    pendingDetail: "Jellyfin 연결 준비중",
    metricA: "/jellyfin",
    metricB: "NAS",
    metadata: {
      proxyPath: "/jellyfin",
      proxyTarget: "28920",
      lastCheckedUrl: "https://sueno.myasustor.com/jellyfin",
    },
  },
  {
    id: "npm",
    title: "Nginx Proxy Manager",
    icon: "server",
    internalUrl: "http://192.168.0.44:81",
    externalUrl: "",
    primary: "internal",
    description: "Reverse Proxy 관리",
    serviceKind: "other",
    placement: "sub",
    adminGroup: "services",
    enabled: true,
    monitoringEnabled: true,
    monitorMode: "direct",
    pendingDetail: "NPM 연결 대기",
    note: "Reverse Proxy 및 SSL 관리",
    accessInfo: "내부 주소 기준 접속",
    ruleSummary: "내부 주소 응답 확인",
    metricA: "81",
    metricB: "NAS",
    metadata: {
      internalIp: "192.168.0.44",
      lastCheckedUrl: "http://192.168.0.44:81",
    },
  },
  {
    id: "portainer",
    title: "Portainer",
    icon: "server",
    internalUrl: "https://192.168.0.44:19943",
    externalUrl: "https://sueno.myasustor.com:19943",
    primary: "internal",
    description: "Docker 컨테이너 관리",
    serviceKind: "other",
    placement: "sub",
    adminGroup: "services",
    enabled: true,
    monitoringEnabled: true,
    monitorMode: "direct",
    pendingDetail: "Portainer 연결 대기",
    note: "Docker 컨테이너 관리 페이지",
    accessInfo: "내부 주소 기준 접속",
    ruleSummary: "내부 주소 응답 확인",
    metricA: "19943",
    metricB: "NAS",
    metadata: {
      internalIp: "192.168.0.44",
      lastCheckedUrl: "https://192.168.0.44:19943",
    },
  },
  {
    id: "ollama",
    title: "Ollama",
    icon: "server",
    internalUrl: "http://127.0.0.1:11434",
    externalUrl: "",
    primary: "internal",
    description: "Mac mini 로컬 AI 서버",
    serviceKind: "ai",
    placement: "main",
    adminGroup: "ai",
    enabled: true,
    monitoringEnabled: true,
    monitorMode: "internal-api",
    note: "brew services start ollama",
    accessInfo: "Mac mini localhost:11434",
    ruleSummary: "Ollama API 응답 기준",
    pendingDetail: "Ollama 상태 확인 대기",
    metricA: "11434",
    metricB: "Local AI",
    metadata: {
      internalIp: "127.0.0.1",
      port: 11434,
      lastCheckedUrl: "http://127.0.0.1:11434/api/tags",
    },
  },
  {
    id: "gemma-model",
    title: "Gemma Model",
    icon: "boxes",
    internalUrl: "",
    externalUrl: "",
    primary: "internal",
    description: "현재 로컬 실행 AI 모델",
    serviceKind: "ai",
    placement: "main",
    adminGroup: "ai",
    enabled: true,
    monitoringEnabled: true,
    monitorMode: "internal-api",
    note: "현재 테스트 모델: gemma3:4b",
    accessInfo: "Ollama를 통해 호출",
    ruleSummary: "모델 존재 및 응답 가능 여부 기준",
    pendingDetail: "Gemma 모델 상태 확인 대기",
    metricA: "gemma3:4b",
    metricB: "4B",
    metadata: {
      model: "gemma3:4b",
      lastCheckedUrl: "http://127.0.0.1:11434/api/tags",
    },
  },
  {
    id: "api-health",
    title: "API Health",
    icon: "boxes",
    internalUrl: "http://192.168.0.218:3000/api/test",
    externalUrl: "",
    primary: "internal",
    description: "Suenify API 상태 확인",
    serviceKind: "api",
    placement: "main",
    adminGroup: "api",
    enabled: true,
    monitoringEnabled: true,
    monitorMode: "internal-api",
    note: "Next.js API Health Check",
    accessInfo: "/api/test",
    ruleSummary: "API 응답 ok:true 기준",
    pendingDetail: "API 상태 확인 대기",
    metricA: "/api/test",
    metricB: "Next.js",
    metadata: {
      lastCheckedUrl: "http://192.168.0.218:3000/api/test",
    },
  },
  {
    id: "api-deploy",
    title: "Deploy Status",
    icon: "boxes",
    internalUrl: "",
    externalUrl: "https://api.suenify.com",
    primary: "external",
    description: "배포 및 API 확장 상태",
    serviceKind: "api",
    placement: "main",
    adminGroup: "api",
    enabled: true,
    monitoringEnabled: true,
    monitorMode: "internal-api",
    note: "GitHub → Mac mini 배포 구조",
    accessInfo: "현재 수동 배포, 추후 자동 배포 예정",
    ruleSummary: "Git pull / build / PM2 restart 기준",
    pendingDetail: "배포 상태 확인 대기",
    metricA: "GitHub",
    metricB: "PM2",
    metadata: {
      lastCheckedUrl: "https://api.suenify.com",
    },
  },
  {
    id: "main-domain",
    title: "Main Domain",
    icon: "globe",
    internalUrl: "",
    externalUrl: "https://sueno.myasustor.com",
    primary: "external",
    description: "외부 메인 주소",
    serviceKind: "domain",
    placement: "main",
    adminGroup: "api",
    enabled: true,
    monitoringEnabled: true,
    monitorMode: "internal-api",
    note: "도메인 연결은 추후 Cloudflare 기준으로 재정리",
    accessInfo: "HTTPS 외부 접속",
    ruleSummary: "도메인 HTTPS 응답 기준",
    pendingDetail: "도메인 연결 준비중",
    metricA: "HTTPS",
    metricB: "Domain",
    metadata: {
      lastCheckedUrl: "https://sueno.myasustor.com",
    },
  },
  {
    id: "nas-storage",
    title: "NAS Storage",
    icon: "hard-drive",
    internalUrl: "http://192.168.0.44",
    externalUrl: "",
    primary: "internal",
    description: "NAS 저장소 사용 상태",
    serviceKind: "storage",
    placement: "sub",
    adminGroup: "storage",
    enabled: true,
    monitoringEnabled: true,
    monitorMode: "internal-api",
    note: "NAS는 메인 서버가 아닌 저장소/백업 역할",
    accessInfo: "NAS 내부 IP 기준",
    ruleSummary: "저장공간 사용률 및 접속 상태 기준",
    pendingDetail: "NAS 저장소 상태 확인 대기",
    metricA: "16TB",
    metricB: "Backup",
    metadata: {
      internalIp: "192.168.0.44",
      lastCheckedUrl: "http://192.168.0.44",
    },
  },
  {
    id: "backup-status",
    title: "Backup Status",
    icon: "hard-drive",
    internalUrl: "",
    externalUrl: "",
    primary: "internal",
    description: "Mac mini → NAS 백업 상태",
    serviceKind: "storage",
    placement: "sub",
    adminGroup: "storage",
    enabled: true,
    monitoringEnabled: true,
    monitorMode: "internal-api",
    note: "추후 자동 백업 스케줄 연결 예정",
    accessInfo: "Mac mini 데이터 백업",
    ruleSummary: "백업 성공 여부 및 최근 백업 시간 기준",
    pendingDetail: "백업 상태 확인 대기",
    metricA: "Pending",
    metricB: "NAS",
  },
];

export const serviceRegistry = DEFAULT_SERVICE_REGISTRY;

export function getDefaultServiceRegistry() {
  const overrides = loadServiceOverrides();

  return DEFAULT_SERVICE_REGISTRY.map((service) => {
    const override = overrides[service.id];

    if (!override) return { ...service };

    return {
      ...service,
      ...override,
      metadata: {
        ...(service.metadata || {}),
        ...((override.metadata as Record<string, string | number | boolean>) ||
          {}),
      },
    };
  });
}

export function loadUserServices(): ServiceRegistryItem[] {
  return loadStoredUserServices();
}

export function saveUserServices(services: ServiceRegistryItem[]) {
  saveStoredUserServices(services);
}

export function getMergedServiceRegistry(): ServiceRegistryItem[] {
  const defaults = getDefaultServiceRegistry();
  const users = loadUserServices();

  return [...defaults, ...users].map((service) => ({
    ...service,
    adminGroup: service.adminGroup ?? "services",
  }));
}

export function addUserService(service: ServiceRegistryItem) {
  const current = loadUserServices();

  const sameTitleExists = current.some(
    (item) =>
      item.title.trim().toLowerCase() === service.title.trim().toLowerCase()
  );

  if (sameTitleExists) {
    throw new Error("같은 이름의 서비스가 이미 존재합니다.");
  }

  let nextId = service.id;
  let suffix = 2;

  while (current.some((item) => item.id === nextId)) {
    nextId = `${service.id}-${suffix}`;
    suffix += 1;
  }

  const nextService: ServiceRegistryItem = {
    ...service,
    id: nextId,
  };

  const next = [...current, nextService];
  saveUserServices(next);
  return next;
}

export function getPrimaryUrl(service: ServiceRegistryItem) {
  if (service.primary === "internal") {
    return service.internalUrl?.trim() || service.externalUrl?.trim() || "";
  }

  return service.externalUrl?.trim() || service.internalUrl?.trim() || "";
}

export function getSecondaryUrl(service: ServiceRegistryItem) {
  if (service.primary === "internal") {
    return service.externalUrl?.trim() || "";
  }

  return service.internalUrl?.trim() || "";
}

export function getServiceById(id: string) {
  return getMergedServiceRegistry().find((service) => service.id === id) ?? null;
}

export function getServiceByTitle(title: string) {
  return (
    getMergedServiceRegistry().find((service) => service.title === title) ?? null
  );
}

export function isDefaultService(id: string) {
  return DEFAULT_SERVICE_REGISTRY.some((service) => service.id === id);
}

export function updateUserService(updatedService: ServiceRegistryItem) {
  const current = loadUserServices();
  const next = current.map((service) =>
    service.id === updatedService.id ? updatedService : service
  );

  saveUserServices(next);
  return next;
}

export function updateService(updatedService: ServiceRegistryItem) {
  if (isDefaultService(updatedService.id)) {
    saveServiceOverride(updatedService.id, {
      title: updatedService.title,
      description: updatedService.description,
      internalUrl: updatedService.internalUrl,
      externalUrl: updatedService.externalUrl,
      primary: updatedService.primary,
      placement: updatedService.placement,
      serviceKind: updatedService.serviceKind,
      icon: updatedService.icon,
      note: updatedService.note,
      accessInfo: updatedService.accessInfo,
      ruleSummary: updatedService.ruleSummary,
      metadata: updatedService.metadata,
      adminGroup: updatedService.adminGroup,
    });

    return getMergedServiceRegistry();
  }

  return updateUserService(updatedService);
}

export function deleteUserService(id: string) {
  const current = loadUserServices();
  const next = current.filter((service) => service.id !== id);
  saveUserServices(next);
  return next;
}

export function canDeleteService(id: string) {
  return !isDefaultService(id);
}