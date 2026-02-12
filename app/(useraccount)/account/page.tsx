import { redirect } from "next/navigation";
import { getCurrentAuthUserFromComponent } from "@/repositories/auth.repository";
import { getCurrentUserProfile } from "@/services/profile.service";
import { getUserOrders, getUserOrderCount } from "@/services/order.service";
import { getAddressesByUserId } from "@/services/address.service";
import { getWishlistItems } from "@/services/wishlist.service";
import { ProfileHeader } from "@/components/(public)/profile/ProfileHeader";
import { ProfileStats } from "@/components/(public)/profile/ProfileStats";
import { ProfileOrders } from "@/components/(public)/profile/ProfileOrders";
import { ChangePasswordForm } from "@/components/account/ChangePasswordForm";
import { AddressList } from "@/components/account/AddressList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, MapPin } from "lucide-react";

export const metadata = {
  title: "My Account | LAMA",
  description: "Manage your profile, orders, password, and addresses.",
};

export default async function AccountProfilePage() {
  const user = await getCurrentAuthUserFromComponent();
  if (!user) redirect("/auth/login?redirect=/account");

  const [profile, orders, addresses, wishlistItems, orderCount] = await Promise.all([
    getCurrentUserProfile(),
    getUserOrders(user.id, 20),
    getAddressesByUserId(user.id),
    getWishlistItems(user.id),
    getUserOrderCount(user.id),
  ]);

  if (!profile) redirect("/auth/login?redirect=/account");

  const wishlistCount = wishlistItems.length;

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-10">
        <h1 className="text-4xl font-black tracking-tight text-foreground">
          My Account
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your profile, orders, password, and addresses.
        </p>
      </div>

      <div className="space-y-8">
        <ProfileHeader profile={profile} email={user.email ?? null} />

        <ProfileStats orderCount={orderCount} wishlistCount={wishlistCount} />

        <ProfileOrders orders={orders} />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Change password
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
        </Card>

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
