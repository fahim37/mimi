import type { Metadata } from "next";
import ContactView from "./contact-view";

export const metadata: Metadata = {
  title: "Contact — Mimi",
  description:
    "Custom fittings, press, stockists or a simple hello — write to the Mimi studio in Dhaka.",
};

export default function ContactPage() {
  return <ContactView />;
}
