import { CheckCircleOutlined, TranslationOutlined } from '@ant-design/icons';
import { Avatar, Layout, Menu, Space, Typography } from 'antd';
import { useMemoizedFn } from 'ahooks';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import styles from './index.module.less';

const { Header, Content } = Layout;

const menuItems = [
  {
    key: '/translate',
    icon: <TranslationOutlined />,
    label: '翻译命名',
  },
  {
    key: '/detect',
    icon: <CheckCircleOutlined />,
    label: '检测占位',
  },
];

// 应用主布局
const AppLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // 跳转菜单页
  const handleMenuClick = useMemoizedFn(({ key }) => {
    navigate(key);
  });

  return (
    <Layout className={styles.layout}>
      <Header className={styles.header}>
        <div className={styles.headerInner}>
          <Space size={14} className={styles.brand}>
            <span className={styles.logo}>AI</span>
            <div>
              <Typography.Title level={3} className={styles.title}>
                AI Tools
              </Typography.Title>
              <Typography.Text className={styles.subtitle}>
                开发命名辅助工具
              </Typography.Text>
            </div>
          </Space>
          <Menu
            mode="horizontal"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={handleMenuClick}
            className={styles.nav}
          />
          <Space size={12} className={styles.userInfo}>
            <Avatar className={styles.avatar}>A</Avatar>
            <span className={styles.userName}>Admin</span>
          </Space>
        </div>
      </Header>
      <Content className={styles.content}>
        <div className={styles.contentInner}>
          <Outlet />
        </div>
      </Content>
    </Layout>
  );
};

export default AppLayout;
