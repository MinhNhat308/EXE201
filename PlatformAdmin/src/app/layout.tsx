import type { Metadata } from "next";
import { ReactNode } from "react";
import "@/styles/globals.css";
import { AppQueryProvider } from "@/lib/query/query-provider";

export const metadata: Metadata = {
  title: "Exe-Milktea SaaS Management Platform",
  description: "Enterprise SaaS management platform for BobaPos operations",
  icons: {
    icon: "/Layer_1.svg",
    shortcut: "/Layer_1.svg",
    apple: "/Layer_1.svg"
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var storageKey = "exe_milktea_theme";
                  var savedTheme = window.localStorage.getItem(storageKey);
                  var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                  var theme = savedTheme === "light" || savedTheme === "dark" ? savedTheme : (prefersDark ? "dark" : "light");
                  document.documentElement.classList.toggle("dark", theme === "dark");
                  document.documentElement.style.colorScheme = theme;
                } catch (error) {}
              })();
            `
          }}
        />
      </head>
      <body>
        <AppQueryProvider>{children}</AppQueryProvider>
      </body>
    </html>
  );
}
