import "./globals.css";
import { ReactQueryProvider } from "@/lib/react-query-provider";

export const metadata = { title: "Esnaf Web" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>
        <ReactQueryProvider>{children}</ReactQueryProvider>
      </body>
    </html>
  );
}
