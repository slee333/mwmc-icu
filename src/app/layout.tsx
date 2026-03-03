import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ICU LLM Study Platform",
  description:
    "Prospective RCT evaluating LLM-augmented clinical decision support for ICU patients with AHRF",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-[family-name:var(--font-inter)] antialiased`}
        style={{
          background:
            "linear-gradient(135deg, #0B1120 0%, #0F172A 50%, #111827 100%)",
        }}
      >
        {children}
      </body>
    </html>
  );
}
