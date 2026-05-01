import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";

type LoginBody = {
  id?: string;
  password?: string;
};

function safeEqual(a: string, b: string) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  return timingSafeEqual(aBuffer, bBuffer);
}

function signSession(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("hex");
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LoginBody;

    const inputId = String(body.id || "").trim();
    const inputPassword = String(body.password || "").trim();

    const adminId = process.env.ADMIN_LOGIN_ID || "admin";
    const adminPassword = process.env.ADMIN_LOGIN_PASSWORD || "1234";
    const sessionSecret =
      process.env.ADMIN_SESSION_SECRET || "suenify-admin-secret";

    if (!inputId || !inputPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "아이디와 비밀번호를 입력해주세요.",
        },
        { status: 400 }
      );
    }

    const isIdValid = safeEqual(inputId, adminId);
    const isPasswordValid = safeEqual(inputPassword, adminPassword);

    if (!isIdValid || !isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          message: "아이디 또는 비밀번호가 올바르지 않습니다.",
        },
        { status: 401 }
      );
    }

    const sessionPayload = JSON.stringify({
      id: adminId,
      loggedInAt: Date.now(),
    });

    const encodedPayload = Buffer.from(sessionPayload).toString("base64url");
    const signature = signSession(encodedPayload, sessionSecret);
    const sessionValue = `${encodedPayload}.${signature}`;

    const response = NextResponse.json({
      success: true,
      message: "로그인 성공",
    });

    response.cookies.set("suenify_admin_session", "logged_in", {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      path: "/",
      maxAge: 60 * 60 * 12,
    });

    return response;
  } catch (error) {
    console.error("login route error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "로그인 처리 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}