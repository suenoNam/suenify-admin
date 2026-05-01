// src/lib/status/actions.ts
import type { ViewType } from "./types";

export type ActionItem = {
  label: string;
  action: "open-url" | "copy-url" | "go-home";
};

export function getActionItems(activeView: ViewType): ActionItem[] {
  switch (activeView) {
    case "nas":
      return [
        { label: "Open NAS", action: "open-url" },
        { label: "Copy URL", action: "copy-url" },
        { label: "Go Home", action: "go-home" },
      ];
    case "jellyfin":
      return [
        { label: "Open Jellyfin", action: "open-url" },
        { label: "Copy URL", action: "copy-url" },
        { label: "Go Home", action: "go-home" },
      ];
    case "main-domain":
      return [
        { label: "Open Domain", action: "open-url" },
        { label: "Copy URL", action: "copy-url" },
        { label: "Go Home", action: "go-home" },
      ];
    case "api-deploy":
      return [
        { label: "Open API", action: "open-url" },
        { label: "Copy URL", action: "copy-url" },
        { label: "Go Home", action: "go-home" },
      ];
    default:
      return [{ label: "Go Home", action: "go-home" }];
  }
}