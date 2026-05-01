export type NasStatusData = {
  서버상태: string;
  외부주소: string;
  내부주소: string;
  저장소사용률: string;
  CPU사용률: string;
  RAM사용률: string;
  총저장공간: string;
  현재사용량: string;
  업데이트시간: string;
  저장공간1?: {
    이름: string;
    총저장공간: string;
    현재사용량: string;
    저장소사용률: string;
  };
  저장공간2?: {
    이름: string;
    총저장공간: string;
    현재사용량: string;
    저장소사용률: string;
  };
};

const DEFAULT_NAS_STATUS: NasStatusData = {
  서버상태: "확인 실패",
  외부주소: "-",
  내부주소: "-",
  저장소사용률: "-",
  CPU사용률: "-",
  RAM사용률: "-",
  총저장공간: "-",
  현재사용량: "-",
  업데이트시간: "-",
  저장공간1: undefined,
  저장공간2: undefined,
};

export async function fetchNasStatus(): Promise<NasStatusData> {
  try {
    const response = await fetch("/api/internal/nas-status", {
  method: "GET",
  cache: "no-store",
});

    if (!response.ok) {
      return DEFAULT_NAS_STATUS;
    }

    const result = await response.json();

if (!result.success || !result.data) {
  return DEFAULT_NAS_STATUS;
}

const data = result.data as Partial<NasStatusData>;

return {
  서버상태: data.서버상태 ?? DEFAULT_NAS_STATUS.서버상태,
  외부주소: data.외부주소 ?? DEFAULT_NAS_STATUS.외부주소,
  내부주소: data.내부주소 ?? DEFAULT_NAS_STATUS.내부주소,
  저장소사용률: data.저장소사용률 ?? DEFAULT_NAS_STATUS.저장소사용률,
  CPU사용률: data.CPU사용률 ?? DEFAULT_NAS_STATUS.CPU사용률,
  RAM사용률: data.RAM사용률 ?? DEFAULT_NAS_STATUS.RAM사용률,
  총저장공간: data.총저장공간 ?? DEFAULT_NAS_STATUS.총저장공간,
  현재사용량: data.현재사용량 ?? DEFAULT_NAS_STATUS.현재사용량,
  업데이트시간: data.업데이트시간 ?? DEFAULT_NAS_STATUS.업데이트시간,
  저장공간1: data.저장공간1,
  저장공간2: data.저장공간2,
};
  } catch (error) {
    console.error("NAS 상태 조회 실패", error);
    return DEFAULT_NAS_STATUS;
  }
}