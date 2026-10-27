import "./globals.css";

export const metadata = {
  title: "GreenBnB | Sustainable Stays",
  description: "Discover thoughtful stays and greener travel with GreenBnB.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
