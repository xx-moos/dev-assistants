import {
  AppstoreOutlined,
  DashboardOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { Avatar, Button, Layout, Menu, Space, Typography } from 'antd';
import { useMemoizedFn, useReactive } from 'ahooks';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import './index.less';

const { Header, Sider, Content } = Layout;

const menuItems = [
  {
    key: '/dashboard',
    icon: <DashboardOutlined />,
    label: '工作台',
  },
  {
    key: '/tools',
    icon: <AppstoreOutlined />,
    label: '工具中心',
  },
  {
    key: '/settings',
    icon: <SettingOutlined />,
    label: '系统设置',
  },
];

// 应用主布局
const AppLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = useReactive({
    isCollapsed: false,
  });
  // 折叠图标判断
  const ToggleIcon = state.isCollapsed ? MenuUnfoldOutlined : MenuFoldOutlined;

  // 切换侧边栏
  const handleToggleSider = useMemoizedFn(() => {
    state.isCollapsed = !state.isCollapsed;
  });

  // 跳转菜单页
  const handleMenuClick = useMemoizedFn(({ key }) => {
    navigate(key);
  });

  return (
    <Layout className="app-layout">
      <Sider
        width={232}
        collapsed={state.isCollapsed}
        className="app-layout__sider"
      >
        <div className="app-layout__brand">
          <span className="app-layout__logo">AI</span>
          <span className="app-layout__name" hidden={state.isCollapsed}>AI Tools</span>
        </div>
        <Menu
          mode="inline"
          theme="dark"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header className="app-layout__header">
          <Space size={16}>
            <Button
              type="text"
              icon={<ToggleIcon />}
              onClick={handleToggleSider}
            />
            <Typography.Title level={4} className="app-layout__title">
              企业 AI 工具平台
            </Typography.Title>
          </Space>
          <Space size={12}>
            <Avatar className="app-layout__avatar">A</Avatar>
            <span className="app-layout__user">Admin</span>
          </Space>
        </Header>
        <Content className="app-layout__content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
