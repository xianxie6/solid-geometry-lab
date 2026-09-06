import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '立体几何实验室 · 10 道交互数学题',
  description: '切换 10 道高中立体几何题，交互观察展开、截面、旋转与面积最值；包含圆锥 Blender 动画。',
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        {children}
      </body>
    </html>
  );
}
