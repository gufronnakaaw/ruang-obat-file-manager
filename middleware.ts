import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.JWT_SECRET_KEY,
  });

  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/auth")) {
    if (!token) {
      return NextResponse.next();
    }

    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!token) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  const response = NextResponse.next();

  response.headers.set("access_token", token.access_token);

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
