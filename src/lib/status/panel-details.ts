import type { StatusCardItem, ViewType } from "@/lib/status/types";

type PanelDetailItem = {
  label: string;
  value: string;
};

function getCard(cardList: StatusCardItem[]) {
  return cardList[0] ?? null;
}

function toText(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
}

export function getPanelDetails(
  activeView: ViewType,
  visibleCards: StatusCardItem[]
): PanelDetailItem[] {
  const card = getCard(visibleCards);
  if (!card) return [];

  if (activeView === "nas") {
    return [
      {
        label: "내부 주소",
        value: toText(card.internalUrl || card.directUrl),
      },
      {
        label: "내부 IP",
        value: toText(card.metricA),
      },
      {
        label: "저장소 사용률",
        value: toText(card.sub?.includes("Storage") ? card.sub.replace("Storage ", "") : card.sub),
      },
      {
        label: "응답 시간",
        value: toText(card.metricB),
      },
      {
        label: "접속 정보",
        value: toText(card.accessInfo),
      },
      {
        label: "메모",
        value: toText(card.note),
      },
    ];
  }

  if (activeView === "jellyfin") {
    return [
      {
        label: "내부 주소",
        value: toText(card.internalUrl),
      },
      {
        label: "외부 주소",
        value: toText(card.externalUrl || card.directUrl),
      },
      {
        label: "접속 정보",
        value: toText(card.accessInfo),
      },
      {
        label: "메모",
        value: toText(card.note),
      },
    ];
  }

  if (activeView === "main-domain") {
  return [
    {
      label: "공개 주소",
      value: toText(card.directUrl || card.externalUrl),
    },
    {
      label: "현재 상태",
      value: toText(card.status),
    },
    {
      label: "체크 기준",
      value: toText(card.ruleSummary),
    },
    {
      label: "메모",
      value: toText(card.note),
    },
  ];
}

  if (activeView === "api-deploy") {
  return [
    {
      label: "엔드포인트 주소",
      value: toText(card.directUrl || card.externalUrl),
    },
    {
      label: "현재 상태",
      value: toText(card.status),
    },
    {
      label: "체크 기준",
      value: toText(card.ruleSummary),
    },
    {
      label: "메모",
      value: toText(card.note),
    },
  ];
}

  return [
  {
    label: "내부 주소",
    value: toText(card.internalUrl),
  },
  {
    label: "외부 주소",
    value: toText(card.externalUrl || card.directUrl),
  },
  {
    label: "현재 상태",
    value: toText(card.status),
  },
  {
    label: "체크 기준",
    value: toText(card.ruleSummary),
  },
  {
    label: "메모",
    value: toText(card.note),
  },
];
}