import './globals.css'

export const metadata = {
  title: 'Trading Journal Pro',
  description: 'Professional trading journal with analytics',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: '#000', color: '#fff' }}>
        {children}
      </body>
    </html>
  )
}