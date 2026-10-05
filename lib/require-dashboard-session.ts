import {notFound} from "next/navigation";

import {redirect} from "@/i18n/navigation";
import {getSessionStatus} from "@/lib/auth/session";

export async function requireDashboardSession(locale: string) {
  const sessionStatus = await getSessionStatus();

  if (sessionStatus === "unauthenticated") {
    redirect({href: "/login", locale});
  }

  if (sessionStatus === "forbidden") {
    notFound();
  }

  if (sessionStatus === "unavailable") {
    throw new Error("Unable to verify session");
  }
}
