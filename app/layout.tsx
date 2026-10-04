import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata={title:"Studio Lite Web",description:"Um editor web profissional para criar e publicar experiências Roblox."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="pt-BR"><body>{children}</body></html>}