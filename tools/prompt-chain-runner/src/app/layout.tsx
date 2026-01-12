import type { Metadata } from "next";
import Image from "next/image";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prompt Chain Runner",
  description: "Multi-prompt chain orchestration for AI research workflows",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">
        <nav className="w-full bg-white border-b h-16 flex items-center justify-center">
          <div className="max-w-6xl w-full px-4 flex items-center gap-6">
            <a href="/" className="hover:opacity-80 transition-opacity">
              <Image
                src="/images/forethought-logo.svg"
                alt="Forethought Research"
                width={120}
                height={32}
                className="h-8 w-auto"
              />
            </a>
            <a href="/" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Prompt chains
            </a>
          </div>
        </nav>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
