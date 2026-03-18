import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { AuthGuard } from "@/components/auth/AuthGuard";
import LayoutContent from "@/components/layout/LayoutContent";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Workflow Automation Platform",
  description: "Internal business workflow automation system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans bg-background text-foreground min-h-screen antialiased`}>
        <AuthProvider>
          <AuthGuard>
            <LayoutContent>
              {children}
            </LayoutContent>
          </AuthGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
