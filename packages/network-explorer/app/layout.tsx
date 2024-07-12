import "@/styles/globals.css";
import { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Modality Blockchain Explorer",
  description: "Welcome to Modality Blockchain Explorer",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="">
      <body className="">
        <Providers>
          <Nav />
          {children}
        </Providers>
      </body>
    </html>
  );
}
