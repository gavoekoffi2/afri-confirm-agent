import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AfriConfirm — Agent Vocal IA COD",
  description: "Confirmez vos commandes e-commerce automatiquement en Afrique",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
