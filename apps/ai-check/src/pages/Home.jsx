import React from "react";
import { Link } from "react-router-dom";

const MENU_ITEMS = [
  {
    title: "模型测试",
    description: "配置 API Token、选择模型并串行测试能力表现。",
    to: "/model-test",
    accent: "linear-gradient(135deg, #2563eb 0%, #38bdf8 100%)",
    badge: "已就绪",
  },
  {
    title: "翻译命名",
    description: "接入谷歌翻译并生成多语言开发命名变量。",
    to: "/translation-naming",
    accent: "linear-gradient(135deg, #b45309 0%, #f59e0b 100%)",
    badge: "已就绪",
  },
];

const Home = () => (
  <div style={styles.page}>
    <header style={styles.hero}>
      <div style={styles.heroBadge}>AI Check</div>
      <h1 style={styles.title}>选择一个入口开始</h1>
      <p style={styles.subtitle}>
        使用 Hash 路由导航，所有工具集中在卡片菜单中，快速进入子页面。
      </p>
    </header>

    <section style={styles.grid}>
      {MENU_ITEMS.map((item) => (
        <Link
          key={item.title}
          to={item.to}
          style={{
            ...styles.card,
            ...(item.disabled ? styles.cardDisabled : null),
          }}
          aria-disabled={item.disabled}
          onClick={(event) => {
            if (item.disabled) event.preventDefault();
          }}
        >
          <span style={{ ...styles.cardAccent, background: item.accent }} />
          <div style={styles.cardBody}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>{item.title}</h2>
              <span
                style={{
                  ...styles.badge,
                  ...(item.disabled ? styles.badgeMuted : null),
                }}
              >
                {item.badge}
              </span>
            </div>
            <p style={styles.cardDesc}>{item.description}</p>
            <div style={styles.cardFooter}>
              <span style={styles.cardHint}>
                {item.disabled ? "即将开放" : "进入子页面"}
              </span>
              <span style={styles.cardArrow}>→</span>
            </div>
          </div>
        </Link>
      ))}
    </section>


  </div>
);

const styles = {
  page: {
    minHeight: "100vh",
    padding: "32px 20px 40px",
    fontFamily: "'Space Grotesk', 'Segoe UI', 'PingFang SC', sans-serif",
    color: "#0f172a",
    background:
      "radial-gradient(circle at top, rgba(59, 130, 246, 0.18), transparent 55%), linear-gradient(160deg, #f8fafc 0%, #eef2ff 45%, #ffffff 100%)",
  },
  hero: {
    maxWidth: 920,
    margin: "0 auto 28px",
    textAlign: "left",
  },
  heroBadge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 12px",
    borderRadius: 999,
    background: "#0f172a",
    color: "#e2e8f0",
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  title: {
    fontSize: 36,
    margin: "0 0 10px 0",
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: 16,
    margin: 0,
    color: "#475569",
    maxWidth: 560,
  },
  grid: {
    display: "grid",
    gap: 18,
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    maxWidth: 920,
    margin: "0 auto",
  },
  card: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 16,
    border: "1px solid rgba(148, 163, 184, 0.5)",
    background: "rgba(255, 255, 255, 0.85)",
    boxShadow: "0 18px 40px rgba(15, 23, 42, 0.08)",
    textDecoration: "none",
    color: "inherit",
    display: "flex",
    minHeight: 180,
    transition: "transform 0.25s ease, box-shadow 0.25s ease",
  },
  cardDisabled: {
    opacity: 0.7,
    cursor: "not-allowed",
  },
  cardAccent: {
    width: 10,
  },
  cardBody: {
    padding: "18px 18px 16px",
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  cardTitle: {
    fontSize: 20,
    margin: 0,
  },
  badge: {
    padding: "4px 8px",
    borderRadius: 999,
    background: "#e0f2fe",
    color: "#0f172a",
    fontSize: 12,
    fontWeight: 600,
  },
  badgeMuted: {
    background: "#e2e8f0",
    color: "#64748b",
  },
  cardDesc: {
    margin: 0,
    fontSize: 14,
    color: "#475569",
    lineHeight: 1.5,
  },
  cardFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: "auto",
    fontSize: 14,
    color: "#1e293b",
  },
  cardHint: {
    fontWeight: 600,
  },
  cardArrow: {
    fontSize: 18,
  },
  footer: {
    textAlign: "center",
    color: "#64748b",
    marginTop: 36,
    fontSize: 13,
  },
};

export default Home;
