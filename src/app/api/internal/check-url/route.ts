import { NextResponse } from "next/server";

import http from "node:http";

import https from "node:https";

function requestUrl(url: string) {

  return new Promise<{

    success: boolean;

    statusCode: number | null;

    responseTime: number | null;

    message: string;

  }>((resolve) => {

    const startedAt = Date.now();

    const isHttps = url.startsWith("https://");

    const client = isHttps ? https : http;

    const req = client.request(

      url,

      {

        method: "GET",

        rejectUnauthorized: false,

      },

      (res) => {

        const responseTime = Date.now() - startedAt;

        const statusCode = res.statusCode ?? null;

        resolve({

          success: typeof statusCode === "number" && statusCode >= 200 && statusCode < 400,

          statusCode,

          responseTime,

          message:

            typeof statusCode === "number"

              ? `응답 수신 (${statusCode})`

              : "응답 수신",

        });

        res.resume();

      }

    );

    req.on("error", (error) => {

      resolve({

        success: false,

        statusCode: null,

        responseTime: null,

        message: error.message || "체크 중 오류 발생",

      });

    });

    req.setTimeout(5000, () => {

      req.destroy(new Error("요청 시간 초과"));

    });

    req.end();

  });

}

export async function POST(request: Request) {

  try {

    const body = await request.json();

    const url = String(body.url || "").trim();

    if (!url) {

      return NextResponse.json({

        success: false,

        message: "URL이 없습니다.",

        statusCode: null,

        responseTime: null,

      });

    }

    const result = await requestUrl(url);

    return NextResponse.json(result);

  } catch (error) {

    return NextResponse.json({

      success: false,

      message: error instanceof Error ? error.message : "체크 중 오류 발생",

      statusCode: null,

      responseTime: null,

    });

  }

}