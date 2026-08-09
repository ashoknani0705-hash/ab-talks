import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { InterviewProvider } from '@/lib/interview-context';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AB TALKS | AI Interview Agent',
  description: 'Master AI Engineering in 31 Days. Personalized technical interviews powered by multi-agent AI.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-background text-foreground min-h-screen antialiased`}>
        <InterviewProvider>{children}</InterviewProvider>
      </body>
    </html>
  );
}
