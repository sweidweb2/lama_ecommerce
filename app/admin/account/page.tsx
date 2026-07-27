import { redirect } from "next/navigation";
import { getCurrentAuthUserFromComponent } from "@/repositories/auth.repository";
import { getCurrentUserProfile } from "@/services/profile.service";
import { AdminBreadcrumbs } from "@/components/admin/AdminBreadcrumbs";
import { EditProfileForm } from "@/components/account/EditProfileForm";
import { ChangePasswordForm } from "@/components/account/ChangePasswordForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = {
  title: "Account | Admin",
  description: "Update your admin name and password.",
};

export default async function AdminAccountPage() {
  const user = await getCurrentAuthUserFromComponent();
  if (!user) redirect("/auth/login?redirect=/admin/account");

  const profile = await getCurrentUserProfile();
  if (!profile) redirect("/auth/login?redirect=/admin/account");

  return (
    <div className="space-y-6 max-w-4xl">
      <AdminBreadcrumbs
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Account" },
        ]}
      />

      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Account</h1>
        <p className="text-muted-foreground text-sm sm:text-base mt-2">
          Update your name or password. Each change is saved separately.
        </p>
        {user.email && (
          <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Display name</CardTitle>
            <CardDescription>Change the name shown in the admin panel.</CardDescription>
          </CardHeader>
          <CardContent>
            <EditProfileForm fullName={profile.full_name} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>
              Enter your current password to set a new one.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
