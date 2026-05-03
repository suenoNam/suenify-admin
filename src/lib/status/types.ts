export type StatusType = "online" | "warning" | "error" | "offline";

export type ServiceStatus = StatusType;

export type ViewType =
  | "dashboard"

  // Server
  | "mac-mini"
  | "nas"

  // Services
  | "suenify-web"
  | "suenify-admin"
  | "jellyfin"
  | "deploy-server"
  | "npm"
  | "portainer"

  // AI System
  | "ollama"
  | "gemma-model"

  // API
  | "api-health"
  | "api-deploy"
  | "main-domain"

  // Storage
  | "nas-storage"
  | "backup-status"

  // Settings
  | "settings-services"
  | "settings-dashboard"
  | "settings-account"
  | "settings-logs"
  | "settings-environment";

export type StatusCardItem = {
  id: string;
  title: string;
  status: string;
  detail: string;
  sub: string;
  type: StatusType;

  note?: string;
  checkedAt?: string;

  directUrl?: string;
  internalUrl?: string;
  externalUrl?: string;
  primaryMode?: "internal" | "external";

  accessInfo?: string;
  metricA?: string;
  metricB?: string;
  ruleSummary?: string;
};