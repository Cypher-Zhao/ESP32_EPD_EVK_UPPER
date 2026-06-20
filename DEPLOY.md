# 部署说明

这是一个纯前端项目，无需后端服务器，可直接部署到 GitHub Pages。

## 快速部署（GitHub Actions，推荐）

本项目已内置 `.github/workflows/deploy.yml`，推送到 `master` 分支后会自动构建并部署。

**操作步骤：**

1. 将项目推送到 GitHub 仓库
2. 在 GitHub 仓库的 **Settings → Pages → Source** 中，选择 **GitHub Actions**
3. 之后每次推送到 `master` 分支，都会自动触发部署

部署完成后访问：`https://<用户名>.github.io/<仓库名>/`

> **提示：** 也可以在 GitHub 仓库的 **Actions** 页面手动点击 **Run workflow** 触发部署。

## 手动部署（Deploy from a branch）

如果不想使用 Actions，也可以手动部署：

1. 在 GitHub 仓库的 **Settings → Pages → Source** 中，选择 **Deploy from a branch**
2. 选择分支（如 `master`）
3. 文件夹选择 `/docs`，然后将 `public/` 目录重命名为 `docs/`，或直接选择 `/ (root)`

> **注意：** GitHub Pages 只支持从根目录 `/` 或 `/docs` 部署，不支持自定义子目录。

## 常见问题

- **404 错误：** 检查 Settings → Pages 是否已正确配置 Source
- **WebSocket 连接问题：** 部分功能依赖 WebSocket，`ws://` 在 `https://` 页面上会被浏览器阻止。若遇到问题，请使用本地部署或 HTTP 访问
- **Web Serial API 兼容性：** 需要 Chrome 或 Edge 89+ 浏览器，且必须在 `localhost` 或 `https://` 环境下才能使用
