import { Raleway } from "next/font/google";
import "./globals.css";
import { Providers } from "@/redux/Providers"; 

const raleway = Raleway({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-raleway",
});

export const metadata = {
  title: "Nyansapo Teaching Dashboard",
  description: "Nyansapo Teaching Dashboard",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${raleway.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
