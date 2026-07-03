# 📚 单词闯关 · Vocab-Quest

上海中考英语词汇游戏化学习 PWA，覆盖牛津上海版教材词汇 + 2026 考纲新增词汇，支持离线使用。

## ✨ 功能特性

- 🎮 **游戏化闯关** — 每单元分为 A/B 两组关卡，共 100+ 关，逐步解锁
- 🎯 **五种题型** — 英译中 / 中译英 / 听力拼写 / 词形变化 / 完形填空
- 📝 **智能错题本** — 自动收集错词，SM-2 间隔复习算法
- 🏆 **成就系统** — 连续打卡、满星通关、百词斩等多种成就徽章
- 🔥 **打卡记录** — 连续天数统计，保持学习势头
- ⭐ **星星评价** — 每关 1-3 星，激励反复练习
- 🎨 **明暗双主题** — 自动跟随系统，也可手动切换
- 📱 **PWA 支持** — 可添加到主屏幕，离线也可使用
- 🔊 **语音朗读** — 点击单词即可听发音（Web Speech API）

## 🚀 在线体验

**[打开应用](https://chenzx-fudan.github.io/vocab-quest/)**

> 也可在手机上用浏览器打开，添加到主屏幕获得 App 体验。

## 📖 词汇数据

| 来源 | 年级 | 词数 |
|------|------|------|
| 牛津上海版教材 | 六年级 | ~493 |
| 牛津上海版教材 | 七年级 | ~497 |
| 牛津上海版教材 | 八年级 | ~500 |
| 牛津上海版教材 | 九年级 | ~498 |
| 2026 中考考纲新增 | 六/七/八年级 | 153 |
| **合计** | | **~2,141** |

词汇数据位于 `data/` 目录，每个词条包含：
- 英文 / 中文释义 / 音标 / 词性
- 例句及翻译
- 派生词（复数、比较级、过去式等）

## 🛠 技术栈

- **纯前端** — HTML + CSS + JS (ES Modules)，无需构建
- **SPA 路由** — 自研 hash 路由 (`js/router.js`)
- **IndexedDB** — 本地存储进度、错题、成就、设置
- **Service Worker** — 离线缓存 + 更新提示
- **Web Speech API** — TTS 语音朗读

### 项目结构

```
vocab-quest/
├── index.html              # 入口页面
├── manifest.json           # PWA 配置
├── sw.js                   # Service Worker
├── css/                    # 样式表
│   ├── variables.css       # CSS 变量 (含明暗主题)
│   ├── layout.css          # 整体布局
│   ├── components.css      # 通用组件
│   ├── map.css             # 闯关地图
│   ├── quiz.css            # 答题界面
│   └── responsive.css      # 响应式适配
├── js/
│   ├── app.js              # 启动入口
│   ├── router.js           # SPA 路由
│   ├── db.js               # IndexedDB 封装
│   ├── models/             # 数据模型
│   │   ├── vocab.js        # 词汇管理
│   │   ├── progress.js     # 进度管理
│   │   ├── errors.js       # 错题本 (SM-2)
│   │   ├── achievements.js # 成就系统
│   │   ├── settings.js     # 设置
│   │   └── checkin.js      # 打卡签到
│   ├── quiz/               # 测验引擎
│   │   ├── engine.js       # 测验会话
│   │   ├── generators.js   # 题目生成
│   │   ├── distractors.js  # 干扰项生成
│   │   └── scoring.js      # 评分计算
│   ├── screens/            # 页面
│   │   ├── home.js         # 首页
│   │   ├── map.js          # 闯关地图
│   │   ├── quiz.js         # 答题页
│   │   ├── results.js      # 结果页
│   │   ├── errors.js       # 错题本
│   │   ├── achievements.js # 成就页
│   │   ├── leaderboard.js  # 排行榜
│   │   └── settings.js     # 设置页
│   ├── components/         # UI 组件
│   │   ├── navbar.js       # 导航栏
│   │   ├── starRating.js   # 星星评分
│   │   ├── progressBar.js  # 进度条
│   │   ├── badgeIcon.js    # 成就图标
│   │   ├── streakBadge.js  # 打卡徽章
│   │   ├── modal.js        # 弹窗
│   │   └── tts.js          # 语音朗读
│   └── utils/              # 工具函数
│       ├── shuffle.js      # 数组随机打乱
│       ├── sample.js       # 随机采样
│       ├── levenshtein.js  # 拼写纠错
│       └── dateUtils.js    # 日期处理
├── data/                   # 词汇数据
│   ├── index.js            # 统一导出
│   ├── grade6.js           # 六年级词汇
│   ├── grade7.js           # 七年级词汇
│   ├── grade8.js           # 八年级词汇
│   ├── grade9.js           # 九年级词汇
│   └── exam2026.js         # 2026考纲新增词汇
└── assets/
    ├── icons/              # PWA 图标
    └── sounds/             # 正确/错误/升级音效
```

## 🏗 本地运行

项目是纯静态文件，用任意 HTTP 服务即可：

```bash
# Python
cd vocab-quest && python -m http.server 8080

# Node.js (需要先装 http-server)
npx http-server vocab-quest -p 8080

# VS Code Live Server 插件也可
```

然后打开 `http://localhost:8080`

## 🚢 部署

部署在 GitHub Pages，`master` 分支推送即自动更新：

```bash
git add -A
git commit -m "..."
git push origin master
```

> 推送后约 1-2 分钟生效。

## 📄 许可

MIT

---

*Made with ❤️ for Shanghai middle school students preparing for the zhongkao.*
