# Git 分支策略

清晰的分支策略是团队协作的基础。

## 常见分支

1. `main`：稳定可发布的分支
2. `develop`：集成分支（可选）
3. `feature/xxx`：功能分支

## 常用命令

```bash
git checkout -b feature/login
git add .
git commit -m "feat: 实现登录功能"
git push origin feature/login
```

> 提交信息建议遵循 Conventional Commits 规范。

更多见 [Git 官方文档](https://git-scm.com/doc)。
