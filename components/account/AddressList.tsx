"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MapPin, Pencil, Trash2, Star, Plus } from "lucide-react";
import type { UserAddress } from "@/types/user";
import { setDefaultAddressAction, deleteAddressAction } from "@/actions/address";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AddressForm } from "./AddressForm";

interface AddressListProps {
  addresses: UserAddress[];
}

export function AddressList({ addresses: initialAddresses }: AddressListProps) {
  const router = useRouter();
  const [addresses, setAddresses] = useState(initialAddresses);
  const [addOpen, setAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const refresh = () => {
    router.refresh();
  };

  const handleSetDefault = async (id: string) => {
    const result = await setDefaultAddressAction(id);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Default address updated");
    refresh();
  };

  const handleDelete = async (id: string) => {
    toast("Remove this address?", {
      description: "This cannot be undone.",
      action: {
        label: "Remove",
        onClick: () => {
          void (async () => {
            const result = await deleteAddressAction(id);
            if (!result.success) {
              toast.error(result.error);
              return;
            }
            setAddresses((prev) => prev.filter((a) => a.id !== id));
            toast.success("Address removed");
            refresh();
          })();
        },
      },
      cancel: {
        label: "Cancel",
        onClick: () => {},
      },
    });
  };

  const editingAddress = editingId
    ? addresses.find((a) => a.id === editingId)
    : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Saved addresses</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setAddOpen(true)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add address
        </Button>
      </div>

      {addresses.length === 0 && !addOpen ? (
        <Card>
          <CardContent className="py-8 text-center">
            <div className="bg-muted/30 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <MapPin className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              No saved addresses. Add one for faster checkout.
            </p>
            <Button onClick={() => setAddOpen(true)} variant="outline" size="sm">
              Add address
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {addresses.map((addr) => (
            <Card key={addr.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    {addr.is_default && (
                      <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                    )}
                    {[addr.address, addr.city, addr.country]
                      .filter(Boolean)
                      .join(", ")}
                    {addr.postal_code && ` ${addr.postal_code}`}
                  </CardTitle>
                  <div className="flex items-center gap-1 shrink-0">
                    {!addr.is_default && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleSetDefault(addr.id)}
                        title="Set as default"
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setEditingId(addr.id)}
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(addr.id)}
                      title="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {addr.phone && (
                <CardContent className="pt-0 text-sm text-muted-foreground">
                  Phone: {addr.phone}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add address</DialogTitle>
          </DialogHeader>
          <AddressForm
            onSuccess={() => {
              setAddOpen(false);
              refresh();
            }}
            onCancel={() => setAddOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editingId)} onOpenChange={(open) => !open && setEditingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit address</DialogTitle>
          </DialogHeader>
          {editingAddress && (
            <AddressForm
              address={editingAddress}
              onSuccess={() => {
                setEditingId(null);
                refresh();
              }}
              onCancel={() => setEditingId(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
