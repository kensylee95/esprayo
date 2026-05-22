import "./globals.scss";
import { ThemeProvider } from "next-themes";
export const metadata = {
  title: "Seranade",
  description: "Gifting App",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
     <html lang="en" suppressHydrationWarning>
      <body style={{ margin: 0 }}>
         <ThemeProvider
          attribute="data-theme"
          defaultTheme="dark"
          themes={["light", "dark"]}
        >
        {children}
        </ThemeProvider>
        </body>
    </html>
  );
}
