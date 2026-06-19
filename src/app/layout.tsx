import type { Metadata } from "next";
import { cache } from "react";
import "./globals.css";
import { config } from "@/lib/config";
import { Providers } from "./providers";
import { DynamicTitle } from "@/components/dynamic-title";
import { getKomariPublicInfo, type KomariResponse } from "@/lib/api";

function resolveEnvBaseUrl(): string | undefined {
  if (typeof process === "undefined") {
    return undefined;
  }

  const explicit =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.KOMARI_BASE_URL;

  if (explicit) {
    return explicit;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return undefined;
}

const runtimeBaseUrl = resolveEnvBaseUrl();

const getPublicInfoCached = cache(
  async (): Promise<
    KomariResponse<{ sitename?: string; description?: string; theme_settings?: Record<string, unknown> }>
  > => {
    // 静态导出阶段可能无法访问后端，直接返回失败让调用方走兜底配置
    if (
      typeof process !== "undefined" &&
      process.env.NEXT_PHASE === "phase-production-build"
    ) {
      return { status: "error" as const };
    }

    return getKomariPublicInfo(runtimeBaseUrl);
  }
);

export async function generateMetadata(): Promise<Metadata> {
  try {
    // 构建绝对URL用于服务端请求
    // 尝试从 /api/public 获取动态站点信息
    const response = await getPublicInfoCached();

    if (response.status === "success" && response.data) {
      return {
        title: response.data.sitename || config.siteTitle,
        description: response.data.description || config.siteDescription,
      };
    }
  } catch (error) {
    // API 调用失败时，记录错误但不抛出异常
    console.debug("获取动态站点信息失败，使用静态配置:", error);
  }

  // 回退到静态配置
  return {
    title: config.siteTitle,
    description: config.siteDescription,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let initialSiteInfo: { sitename?: string; description?: string; theme_settings?: Record<string, unknown> } | null =
    null;

  try {
    const siteInfoResponse = await getPublicInfoCached();
    if (siteInfoResponse.status === "success" && siteInfoResponse.data) {
      initialSiteInfo = siteInfoResponse.data;
    }
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.debug("获取初始站点信息失败:", error);
    }
  }

  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <meta
          name="theme-color"
          content="#ffffff"
          media="(prefers-color-scheme: light)"
        />
        <meta
          name="theme-color"
          content="#000000"
          media="(prefers-color-scheme: dark)"
        />
        {/* API预连接：在未知部署子路径下可能指向错误，移除以避免绝对路径问题 */}
        {/* 关键CSS内联 - 防止FOUC和CLS */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
            /* 基础重置 - 防止FOUC */
            *{box-sizing:border-box}
            body{margin:0;background:#f5f5f7;color:#1d1d1f;font-family:'MiSans','Inter',system-ui,-apple-system,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;overscroll-behavior:none}
            html.dark body{background:#1d1d1f;color:#f5f5f7}
            .dashboard-title h1{font-size:1.25rem;font-weight:600;letter-spacing:-0.01em;margin:0}
          `,
          }}
        />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers initialSiteInfo={initialSiteInfo}>
          <DynamicTitle />
          {children}
        </Providers>
      </body>
    </html>
  );
}
