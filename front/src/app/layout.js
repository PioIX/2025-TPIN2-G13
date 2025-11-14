import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Image from "next/image";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "KabeGol",
  description: "",
  manifest: "/manifest.json",
  icons: {
    icon: "/backgrounds/Logo.png"
  },
  appleWebApp: {
    capable: true, // Le dice a Safari que es una "app"
    statusBarStyle: 'black-translucent', // Estilo de la barra de estado
    title: 'Kabegol',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
