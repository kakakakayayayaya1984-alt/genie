import "@/css/satoshi.css";
import "@/css/style.css";

import "flatpickr/dist/flatpickr.min.css";
import "jsvectormap/dist/jsvectormap.css";

import NextTopLoader from "nextjs-toploader";
import { Providers } from "./providers";
import { ToastContainer } from "react-toastify";

export const metadata = {
  title: {
    template: "%s | Room Mitra Dashboard",
    default: "Room Mitra Dashboard",
  },
  description: "Room Mitra dashboard to manage guest requests",
  manifest: "/manifest.json",
  themeColor: "#1e40af",
  icons: {
    icon: "/images/logo/logo.svg",
    apple: "/images/logo/logo.svg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <NextTopLoader color="#5750F1" showSpinner={false} />

          {children}
        </Providers>
        <ToastContainer />
      </body>
    </html>
  );
}
