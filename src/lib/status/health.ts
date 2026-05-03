export async function checkService(url: string) {
  try {
    const res = await fetch(url, { method: "GET" });

    if (!res) {
      return { type: "error", status: "Error" };
    }

    return {
      type: "online",
      status: "Online",
    };
  } catch (e) {
    return {
      type: "error",
      status: "Error",
    };
  }
}