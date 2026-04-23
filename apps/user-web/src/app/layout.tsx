import "./globals.scss";
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
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
