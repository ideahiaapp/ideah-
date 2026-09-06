"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { checkPassword, createAdminCookieValue, COOKIE_NAME } from "@/lib/adminAuth";

export async function login(formData: FormData) {
  const password = String(formData.get("password") || "");

  if (!checkPassword(password)) {
    redirect("/interessados?erro=1");
  }

  const { value, maxAge } = createAdminCookieValue();
  cookies().set(COOKIE_NAME, value, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge,
    path: "/",
  });
  redirect("/interessados");
}

export async function logout() {
  cookies().delete(COOKIE_NAME);
  redirect("/interessados");
}
