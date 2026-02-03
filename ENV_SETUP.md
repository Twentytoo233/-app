# 环境变量设置说明

## 创建环境变量文件

在项目根目录创建 `.env.local` 文件（此文件不会被提交到 Git）：

```env
# Gemini API Key - 只在后端使用，不会暴露到前端
GEMINI_API_KEY=your_gemini_api_key_here

# Next.js 环境变量（可选）
NEXT_PUBLIC_APP_NAME=VoyageMaster AI
```

## 安全说明

1. **API Key 安全**：
   - `GEMINI_API_KEY` 只会在服务器端（Next.js API Routes）使用
   - 前端代码无法直接访问此环境变量
   - 所有 Gemini API 调用都通过 `/app/api/gemini/route.ts` 处理

2. **不要提交到 Git**：
   - `.env.local` 文件已添加到 `.gitignore`
   - 不要将包含真实 API Key 的文件提交到版本控制

3. **获取 Gemini API Key**：
   - 访问 [Google AI Studio](https://makersuite.google.com/app/apikey)
   - 创建新的 API Key
   - 将 API Key 复制到 `.env.local` 文件中

## 验证设置

启动开发服务器后，如果 API Key 配置正确，应用应该能够正常调用 Gemini API。

如果遇到 "GEMINI_API_KEY is not configured" 错误，请检查：
1. `.env.local` 文件是否存在于项目根目录
2. 环境变量名称是否正确（`GEMINI_API_KEY`）
3. 是否重启了开发服务器（修改环境变量后需要重启）
