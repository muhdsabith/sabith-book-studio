import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'Sabith Book Studio — My Books',description:'Books and creative inspiration by Muhammed Sabith.'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}