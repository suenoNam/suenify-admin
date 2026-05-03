const ADMIN_TRIGGER_SECRET = "suenify-admin-trigger-secret-2026";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const target = body?.target;

    if (target !== "admin" && target !== "web") {
      return Response.json(
        { ok: false, message: "Invalid deploy target" },
        { status: 400 }
      );
    }

    const res = await fetch(`https://deploy.suenify.com/trigger/${target}`, {
      method: "POST",
      headers: {
        "x-suenify-admin-secret": ADMIN_TRIGGER_SECRET,
      },
      cache: "no-store",
    });

    const text = await res.text();

    if (!res.ok) {
      return Response.json(
        { ok: false, message: text },
        { status: res.status }
      );
    }

    return Response.json({
      ok: true,
      target,
      message: text,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      { ok: false, message: "Deploy trigger failed" },
      { status: 500 }
    );
  }
}