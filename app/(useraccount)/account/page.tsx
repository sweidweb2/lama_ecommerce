import { redirect } from "next/navigation";
import { getCurrentAuthUserFromComponent } from "@/repositories/auth.repository";
import { getCurrentUserProfile } from "@/services/profile.service";
import { getAddressesByUserId } from "@/services/address.service";
import { ProfileHeader } from "@/components/(public)/profile/ProfileHeader";
import { AddressList } from "@/components/account/AddressList";
import { ChangePasswordDialog } from "@/components/account/ChangePasswordDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";

export const metadata = {
  title: "My Account",
  description: "Manage your profile, password, and addresses.",
};

export default async function AccountProfilePage() {
  const user = await getCurrentAuthUserFromComponent();
  if (!user) redirect("/auth/login?redirect=/account");

  const [profile, addresses] = await Promise.all([
    getCurrentUserProfile(),
    getAddressesByUserId(user.id),
  ]);

  if (!profile) redirect("/auth/login?redirect=/account");

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-10">
        <h1 className="text-4xl font-black tracking-tight text-foreground">
          My Account
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your profile, password, and addresses.
        </p>
      </div>

      <div className="space-y-8">
        <ProfileHeader profile={profile} email={user.email ?? null} />

        <div className="flex items-center gap-2">
          <ChangePasswordDialog />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Addresses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AddressList addresses={addresses} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
