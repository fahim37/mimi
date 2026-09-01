import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Providers from "./shop/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://thebrandmimi.com"),
  title: "Mimi — A Study in Presence",
  description: "Mimi presents a wardrobe of fluid silhouettes, decisive colour and confident ease.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
