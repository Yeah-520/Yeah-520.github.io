# CSS 布局：Flexbox 与 Grid

一维用 Flexbox，二维用 Grid，是常见的选择思路。

## Flexbox

适合**单行或单列**的排列，例如导航栏、按钮组：

```css
.nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
```

## Grid

适合**二维**的网格布局：

```css
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
```

## 小结

- 主轴对齐用 `justify-content`
- 交叉轴对齐用 `align-items`
- 复杂布局可两者结合使用
