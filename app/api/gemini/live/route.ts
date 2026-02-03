import { NextRequest, NextResponse } from 'next/server';

/**
 * Live Assistant 配置获取
 * 注意：由于实时音频流需要 WebSocket 连接，而 Next.js API 路由不支持 WebSocket，
 * 这里返回 API Key 供前端使用。在生产环境中，应该使用 WebSocket 代理服务器来保护 API Key。
 * 
 * 安全建议：
 * 1. 使用 WebSocket 代理服务器（如使用 Node.js + ws 库）
 * 2. 使用临时 token 或 session token
 * 3. 限制 API Key 的使用范围和权限
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lang } = body;

    // 验证 API Key 存在
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not configured' },
        { status: 500 }
      );
    }

    // 注意：在生产环境中，应该使用更安全的方式
    // 这里返回 API Key 是为了支持实时音频流功能
    // 理想情况下应该使用 WebSocket 代理服务器
    return NextResponse.json({
      apiKey: apiKey,
      // 可以添加其他配置，如模型名称等
    });
  } catch (error: any) {
    console.error('Live Assistant API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initialize Live Assistant' },
      { status: 500 }
    );
  }
}
