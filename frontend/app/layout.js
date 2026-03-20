import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata = {
  title: "The Green Gambit — Real-Time Bidding Platform",
  description: "Experience the thrill of real-time bidding. Compete with others, place your bets, and win exclusive items.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#091f13] text-white font-[family-name:var(--font-inter)]">
        <Navbar />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
