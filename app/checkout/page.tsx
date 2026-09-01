import type { Metadata } from "next";
import CheckoutView from "./checkout-view";

export const metadata: Metadata = {
  title: "Checkout — Mimi",
  description: "Complete your Mimi order.",
};

export default function CheckoutPage() {
  return <CheckoutView />;
}
