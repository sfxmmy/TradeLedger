import './globals.css'

export const metadata = {
  title: 'LSDTRADE+ | Trading Journal',
  description: 'Professional trading journal for serious traders',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
