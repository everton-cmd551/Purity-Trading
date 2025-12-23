import type { Metadata } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { NextAuthProvider } from "@/components/providers/NextAuthProvider";

export const metadata: Metadata = {
  title: "Purity Trading Control System",
  description: "Commodity trading and financing control system",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={cn("min-h-screen bg-background text-foreground antialiased", "font-sans")}>
        <NextAuthProvider>
          {children}
        </NextAuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
