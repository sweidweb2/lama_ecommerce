import { FindOrderForm } from "@/components/(public)/orders/FindOrderForm";

export const metadata = {
  title: "Find your order",
  description:
    "Look up a guest order with your checkout email and confirmation code.",
};

export default function FindOrderPage() {
  return (
    <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-12 sm:py-16 lg:py-20 xl:py-24">
      <FindOrderForm />
    </div>
  );
}
