import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'YT-Downloader — by Chetan Agarwal',
  description: 'Download videos in maximum quality with audio merging. Built by Chetan Agarwal.',
  authors: [{ name: 'Chetan Agarwal', url: 'https://github.com/Agarwalchetan' }],
  keywords: ['youtube downloader', 'video downloader', 'yt-dlp', 'chetan agarwal'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
