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
          {/* <Space size={14} className={styles.brand}>
            <span className={styles.logo}>AI</span>
          </Space> */}
          <div></div>
          <Menu
            mode="horizontal"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={handleMenuClick}
            className={styles.nav}
          />
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
