export async function GET(req: Request) {
  const url = new URL(req.url).searchParams.get("url");

  if (!url) {
    return Response.json({ ok: false });
  }

  const start = Date.now();

  try {
    const res = await fetch(url, { cache: "no-store" });

    const end = Date.now();

    return Response.json({
      ok: res.ok,
      status: res.status,
      responseTime: end - start,
    });
  } catch {
    return Response.json({
      ok: false,
      responseTime: 0,
    });
  }
}