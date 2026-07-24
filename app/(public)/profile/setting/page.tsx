import { redirect } from "next/navigation";

export const metadata = {
  title: "Settings",
  description: "Manage your account settings and preferences.",
};

/** Settings live on /account — keep /profile/setting as a redirect. */
export default function SettingsPage() {
  redirect("/account");
}
