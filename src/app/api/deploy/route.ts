export async function GET() {
  try {
    const res = await fetch("https://deploy.suenify.com/health", {
      cache: "no-store",
    });

    const data = await res.json();

    return Response.json(data);
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        ok: false,
        message: "deploy server health fetch failed",
      },
      { status: 500 }
    );
  }
}