import { redirect } from "next/navigation";
import { clearAdminSession } from "@/lib/admin-auth";

export async function POST() {
  await clearAdminSession();
  redirect("/admin/login");
}
