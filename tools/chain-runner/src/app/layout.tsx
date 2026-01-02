import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chain Runner",
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
        <div className="max-w-6xl mx-auto px-4 py-8">
          <header className="mb-8">
            <nav className="flex items-center gap-6">
              <a href="/" className="text-xl font-semibold hover:opacity-80">
                Chain Runner
              </a>
              <a href="/" className="text-sm opacity-70 hover:opacity-100">
                Dashboard
              </a>
            </nav>
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
