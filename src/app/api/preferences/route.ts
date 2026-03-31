import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const DEMO_COOKIE = "astra-demo";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { demo?: boolean };
    const cookieStore = await cookies();

    if (body.demo === true) {
      cookieStore.set(DEMO_COOKIE, "1", {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });
    } else {
      cookieStore.delete(DEMO_COOKIE);
    }

    return NextResponse.json({ ok: true, demo: Boolean(body.demo) });
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }
}
