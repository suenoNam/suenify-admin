import type { ViewType } from "./types";

export type PanelBlock = {
  title: string;
  description: string;
};

export function getPanelBlocks(activeView: ViewType): PanelBlock[] {
  switch (activeView) {
    case "nas":
      return [
        {
          title: "Storage Usage",
          description:
            "Track total storage usage, threshold level, and available capacity for the NAS volume.",
        },
        {
          title: "Local Network Response",
          description:
            "Monitor internal response time for local access and identify slowdowns in the LAN path.",
        },
        {
          title: "Primary Access Route",
          description:
            "Use the internal NAS address for direct local administration and system checks.",
        },
      ];

    case "jellyfin":
      return [
        {
          title: "Media Sync Delay",
          description:
            "Check whether library sync is delayed and whether metadata updates are being reflected normally.",
        },
        {
          title: "External Route Health",
          description:
            "Validate reverse proxy access through the external /jellyfin route and confirm service reachability.",
        },
        {
          title: "Playback Service State",
          description:
            "Observe service responsiveness and detect playback or session-related abnormalities.",
        },
      ];

    case "main-domain":
      return [
        {
          title: "SSL Validity",
          description:
            "Confirm certificate validity and detect trust or renewal issues on the public domain.",
        },
        {
          title: "Public Reachability",
          description:
            "Verify that the main domain is reachable from outside and routing remains stable.",
        },
        {
          title: "Traffic Overview",
          description:
            "Review visitor activity and basic public-access health indicators for the main domain.",
        },
      ];

    case "api-deploy":
      return [
        {
          title: "Build State",
          description:
            "Track whether the latest deployment completed successfully and whether build steps passed.",
        },
        {
          title: "Response Health",
          description:
            "Monitor API response timing and identify when latency crosses warning thresholds.",
        },
        {
          title: "Backend Route Plan",
          description:
            "Keep the reserved API endpoint structure ready for future backend integration and testing.",
        },
      ];

    default:
      return [
        {
          title: "NAS Core",
          description:
            "Internal network, storage, and hardware monitoring for the primary NAS environment.",
        },
        {
          title: "Jellyfin",
          description:
            "Media service health, reverse proxy path status, and playback service overview.",
        },
        {
          title: "Main Domain",
          description:
            "Public accessibility, SSL trust state, and domain health monitoring.",
        },
        {
          title: "API & Deploy",
          description:
            "Deployment state, endpoint health, and backend route readiness overview.",
        },
      ];
  }
}