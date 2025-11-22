import Navbar from '@/src/components/ui/Navbar';
import './globals.css';
import GoogleAnalytics from '@/src/components/GoogleAnalytics';
import Footer from '../components/ui/Footer';

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://roommitra.com'),
  title: 'Room Mitra',
  description:
    "Hotel's AI Voice Agent, Available 24/7. Handle phone bookings, guest queries, and in-room service requests with a single intelligent voice agent. No hold times, no missed calls, no operational chaos.",
  favicon: '/favicon.ico',
  openGraph: {
    images: ['/room-mitra-logo.png'],
  },
  twitter: {
    images: ['/room-mitra-logo.png'],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={` bg-gray-900`}>
        <GoogleAnalytics />
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
