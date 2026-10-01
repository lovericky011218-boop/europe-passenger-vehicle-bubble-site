# 欧洲乘用车市场交互气泡图

基于欧洲 39 个国家乘用车数据制作的交互看板，可多选国家和年份，并按尺寸、价格、车身形式和动力形式筛选。相同车型与动力形式会合并已选国家与期间的销量，价格取国家 × 年份价格中位数。

支持高清 PNG 图片导出（含当前筛选、缩放、搜索高亮、参考五角星和占比统计），以及区隔能源销量占比、新能源率（BEV + PHEV + REV/REEV）和车身形式销量占比。占比以筛选后可绘图车型销量为分母，搜索高亮、缩放和参考五角星不改变统计口径；缺参数而无法绘图的记录不计入。滚轮缩放幅度减半，三张占比卡片等高且比例条对齐。

2024、2025 为全年，2026 为 1–7 月累计。多选时按实际所选期间加总，详情显示各国家及各年份销量。价格统一使用源表的欧元价格字段；挪威等非欧元市场不能直接使用当地货币数字。缺少车长或价格的销量记录也会保留，页面显示待补参数清单。`data/import-audit.json` 按国家及年份核对源表与导入销量。

## 在线访问

- [GitHub Pages](https://lovericky011218-boop.github.io/europe-passenger-vehicle-bubble-site/)
- [Sites 版本](https://europe-passenger-vehicle-market-map-2026.lovericky011218.chatgpt.site/)

## 本地运行

```bash
python3 -m http.server 4176 --directory dist
```

打开 <http://127.0.0.1:4176/>。

## 验证

```bash
node scripts/check-site.mjs
```
