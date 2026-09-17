import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavBar from "./components/NavBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "API Stress Dashboard",
  description: "Simulate load and monitor your API's performance in real-time.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white`}
      >
        <main className="min-h-screen p-8 sm:p-8 font-sans">
          <div className="max-w-7xl mx-auto">
            <header className="mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold text-white">Zero-Downtime API Stress Dashboard</h1>
              <p className="text-gray-400 mt-2">Simulate load and monitor your API&apos;s performance in real-time.</p>
            </header>
            <NavBar />
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
