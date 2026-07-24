"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { addressBaseSchema } from "@/lib/validators/user_address/base";
import { createAddressAction, updateAddressAction } from "@/actions/address";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { UserAddress } from "@/types/user";

type AddressFormValues = z.input<typeof addressBaseSchema>;
type AddressFormOutput = z.output<typeof addressBaseSchema>;

interface AddressFormProps {
  address?: UserAddress | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function AddressForm({ address, onSuccess, onCancel }: AddressFormProps) {
  const isEdit = Boolean(address?.id);

  const form = useForm<AddressFormValues, unknown, AddressFormOutput>({
    resolver: zodResolver(addressBaseSchema),
    defaultValues: {
      country: address?.country ?? "",
      city: address?.city ?? "",
      address: address?.address ?? "",
      postal_code: address?.postal_code ?? "",
      phone: address?.phone ?? "",
      is_default: address?.is_default ?? false,
    },
  });

  const onSubmit = async (data: AddressFormOutput) => {
    if (isEdit && address) {
      const result = await updateAddressAction(address.id, {
        country: data.country,
        city: data.city,
        address: data.address,
        postal_code: data.postal_code || null,
        phone: data.phone,
        is_default: data.is_default,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Address updated");
    } else {
      const result = await createAddressAction({
        country: data.country,
        city: data.city,
        address: data.address,
        postal_code: data.postal_code || null,
        phone: data.phone,
        is_default: data.is_default,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Address added");
    }
    form.reset(
      isEdit
        ? { ...data }
        : {
            country: "",
            city: "",
            address: "",
            postal_code: "",
            phone: "",
            is_default: false,
          }
    );
    onSuccess?.();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. United States" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. New York" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Street address</FormLabel>
              <FormControl>
                <Input placeholder="Street, building, apt" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="postal_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Postal code (optional)</FormLabel>
                <FormControl>
                  <Input placeholder="ZIP / Postal code" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input placeholder="+1 234 567 8900" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="is_default"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center gap-2 space-y-0">
              <FormControl>
                <input
                  type="checkbox"
                  checked={Boolean(field.value)}
                  onChange={field.onChange}
                  className="h-4 w-4 rounded border-input"
                />
              </FormControl>
              <FormLabel className="font-normal cursor-pointer">Use as default address</FormLabel>
            </FormItem>
          )}
        />
        <div className="flex gap-2">
          <Button type="submit" loading={form.formState.isSubmitting}>
            {isEdit ? "Save changes" : "Add address"}
          </Button>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
