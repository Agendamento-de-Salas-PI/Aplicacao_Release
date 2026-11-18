import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "Agendador de Salas | FATEC Jahu",
  description: "Sistema de agendamento de salas de aula da FATEC Jahu",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <AppProvider>
          <div className="app">
            <Header />
            {children}
          </div>
        </AppProvider>
      </body>
    </html>
  );
}