import { redirect } from "next/navigation";

export const metadata = {
  title: "My Profile",
  description: "View and manage your profile, orders, and preferences.",
};

/** Live account management lives on /account — keep /profile as a redirect. */
export default function ProfilePage() {
  redirect("/account");
}
