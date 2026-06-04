import { redirect } from "next/navigation";
import { createAdminSession, isAdminAuthenticated, verifyAdminPassword } from "@/lib/admin-auth";

interface AdminLoginPageProps {
  searchParams: Promise<{
    error?: string;
  }>;
}

async function loginAdmin(formData: FormData) {
  "use server";

  const password = String(formData.get("password") ?? "");

  if (!verifyAdminPassword(password)) {
    redirect("/admin/login?error=1");
  }

  await createAdminSession();
  redirect("/admin");
}

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  if (await isAdminAuthenticated()) {
    redirect("/admin");
  }

  const { error } = await searchParams;

  return (
    <main className="min-h-screen bg-[#f5f6f8] px-4 py-10 text-[#111827] sm:px-6">
      <section className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-md content-center">
        <div className="rounded-[8px] border border-[#d9dee7] bg-white p-6 shadow-sm">
          <div className="border-b border-[#e5e7eb] pb-5">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#6b7280]">
              CardifyBooth
            </p>
            <h1 className="mt-2 text-2xl font-black tracking-normal text-[#111827]">
              Admin Login
            </h1>
            <p className="mt-2 text-sm font-medium leading-6 text-[#5b6472]">
              Enter the booth admin password to view card generation operations.
            </p>
          </div>

          <form action={loginAdmin} className="mt-6 grid gap-4">
            <label className="grid gap-2 text-sm font-bold text-[#374151]">
              Password
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="h-11 rounded-[6px] border border-[#cfd6e2] bg-white px-3 text-base font-semibold text-[#111827] outline-none transition focus:border-[#2563eb]"
              />
            </label>

            {error && (
              <p className="rounded-[6px] border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-sm font-semibold text-[#991b1b]">
                Incorrect admin password.
              </p>
            )}

            <button
              type="submit"
              className="h-11 rounded-[6px] bg-[#111827] px-4 text-sm font-black text-white transition hover:bg-[#1f2937]"
            >
              Sign in
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
