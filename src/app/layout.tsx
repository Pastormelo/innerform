import type { Metadata, Viewport } from "next";
// "Big Shoulders Display" was consolidated into the "Big Shoulders" family on Google Fonts.
import { Big_Shoulders, Hanken_Grotesk } from "next/font/google";
import { AppStoreProvider } from "@/lib/store/AppStoreProvider";
import "./globals.css";

const bigShoulders = Big_Shoulders({
  variable: "--font-big-shoulders",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "InnerForm — Built from the inside out.",
  description:
    "InnerForm is an AI nutrition coach that learns your body, plans your meals, tracks your food, and holds you accountable to the habits your goal requires.",
  applicationName: "InnerForm",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/logo.svg" },
};

export const viewport: Viewport = {
  themeColor: "#111827",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${bigShoulders.variable} ${hanken.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <AppStoreProvider>{children}</AppStoreProvider>
      </body>
    </html>
  );
}
