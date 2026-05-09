import { useEffect, useRef, useState } from 'react';
import { Card, Col, Row, Typography, Table, Empty } from 'antd';
import {
  TeamOutlined,
  IdcardOutlined,
  CalendarOutlined,
  DollarOutlined,
  WarningOutlined,
  FireOutlined,
  LoginOutlined,
} from '@ant-design/icons';
import * as echarts from 'echarts/core';
import { BarChart, LineChart } from 'echarts/charts';
import {
  GridComponent, TooltipComponent, LegendComponent, TitleComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import dayjs from 'dayjs';
import { apiMemberStats, apiCheckInToday, MemberStats } from '@/api/member';
import { apiScheduleList } from '@/api/course';
import { apiMonthRevenue } from '@/api/finance';
import {
  apiRevenueTrend, apiHotCourses, apiStockAlerts, apiMemberGrowth,
  RevenueTrendItem, HotCourseItem, StockAlertItem, MemberGrowthItem,
} from '@/api/dashboard';
import { useAuthStore } from '@/stores/authStore';
import ExpiringList from './ExpiringList';

echarts.use([BarChart, LineChart, GridComponent, TooltipComponent, LegendComponent, TitleComponent, CanvasRenderer]);

const { Title, Text } = Typography;

function useChart(data: any, buildOption: (d: any) => any) {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts>();
  useEffect(() => {
    if (!ref.current) return;
    if (!chartRef.current) chartRef.current = echarts.init(ref.current);
    if (data) chartRef.current.setOption(buildOption(data), true);
    const onResize = () => chartRef.current?.resize();
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('resize', onResize); };
  }, [data]);
  return ref;
}

export default function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const [stats, setStats] = useState<MemberStats | null>(null);
  const [weekCount, setWeekCount] = useState(0);
  const [revenue, setRevenue] = useState(0);

  const [revTrend, setRevTrend] = useState<RevenueTrendItem[] | null>(null);
  const [hotCourses, setHotCourses] = useState<HotCourseItem[] | null>(null);
  const [stockAlerts, setStockAlerts] = useState<StockAlertItem[]>([]);
  const [memberGrowth, setMemberGrowth] = useState<MemberGrowthItem[] | null>(null);
  const [todayCheckIns, setTodayCheckIns] = useState(0);

  const canMember = hasPermission('member:view');
  const canMembership = hasPermission('membership:view');
  const canCourse = hasPermission('course:view');
  const canProduct = hasPermission('product:view');
  const canReport = hasPermission('report:view');
  const canCheckin = hasPermission('checkin:view');

  useEffect(() => {
    if (canMember) {
      apiMemberStats().then(setStats).catch(() => {});
      apiMemberGrowth().then(setMemberGrowth).catch(() => {});
    }
    if (canCheckin) {
      apiCheckInToday().then((r) => setTodayCheckIns(r.today)).catch(() => {});
    }
    if (canCourse) {
      const start = dayjs().startOf('isoWeek' as any).toISOString();
      const end = dayjs().endOf('isoWeek' as any).toISOString();
      apiScheduleList({ start, end })
        .then((list) => setWeekCount(list.length))
        .catch(() => {});
      apiHotCourses().then(setHotCourses).catch(() => {});
    }
    if (canReport) {
      apiMonthRevenue().then((r) => setRevenue(r.revenue)).catch(() => {});
      apiRevenueTrend().then(setRevTrend).catch(() => {});
    }
    if (canProduct) {
      apiStockAlerts().then(setStockAlerts).catch(() => {});
    }
  }, []);

  const revChartRef = useChart(revTrend, (d: RevenueTrendItem[]) => ({
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: d.map((i) => i.date) },
    yAxis: { type: 'value', name: '元' },
    series: [{ type: 'line', data: d.map((i) => i.revenue), smooth: true, areaStyle: { opacity: 0.12, color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#4f6f8f' }, { offset: 1, color: 'transparent' }] } }, itemStyle: { color: '#4f6f8f' }, lineStyle: { width: 2.5 } }],
    grid: { top: 30, bottom: 30, left: 50, right: 20 },
  }));

  const growthRef = useChart(memberGrowth, (d: MemberGrowthItem[]) => ({
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: d.map((i) => i.month) },
    yAxis: { type: 'value', name: '人', minInterval: 1 },
    series: [{ type: 'bar', data: d.map((i) => i.count), itemStyle: { color: '#5cb85c', borderRadius: [4, 4, 0, 0] } }],
    grid: { top: 30, bottom: 30, left: 50, right: 20 },
  }));

  const hotRef = useChart(hotCourses, (d: HotCourseItem[]) => ({
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'value', name: '人次' },
    yAxis: { type: 'category', data: d.map((i) => i.name).reverse() },
    series: [{ type: 'bar', data: d.map((i) => i.count).reverse(), itemStyle: { color: '#d9534f', borderRadius: [0, 4, 4, 0] } }],
    grid: { top: 10, bottom: 30, left: 80, right: 20 },
  }));

  const allStatCards = [
    canMember && { title: '会员总数', value: stats?.total ?? 0, icon: <TeamOutlined />, suffix: '人', sub: `本月新增 ${stats?.new_this_month ?? 0}`, accent: '#4f6f8f' },
    canMember && { title: '有效会籍', value: stats?.active_memberships ?? 0, icon: <IdcardOutlined />, suffix: '张', sub: '自动过期每日清理', accent: '#5cb85c' },
    canCourse && { title: '本周课程', value: weekCount, icon: <CalendarOutlined />, suffix: '节', sub: '含团课与私教', accent: '#f0a230' },
    canReport && { title: '本月营收', value: revenue, icon: <DollarOutlined />, suffix: '元', sub: '实时汇总', accent: '#d9534f', precision: 2 },
    canCheckin && { title: '今日签到', value: todayCheckIns, icon: <LoginOutlined />, suffix: '人', sub: '实时入场统计', accent: '#8b5cf6' },
  ];
  const statCards = allStatCards.filter(Boolean) as Exclude<(typeof allStatCards)[number], false>[];

  return (
    <div>
      {/* 欢迎语 */}
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0, color: '#1e293b' }}>
          {user?.realName || user?.username}，欢迎回来
        </Title>
        <Text style={{ color: '#94a3b8', fontSize: 13 }}>
          {user?.roleName} · 今天是 {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
        </Text>
      </div>

      {/* 统计卡片 */}
      {statCards.length > 0 && (
        <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
          {statCards.map((s) => (
            <Col xs={24} sm={12} md={8} lg={Math.floor(24 / statCards.length)} key={s.title}>
              <Card
                className="stat-card"
                style={{ borderTop: `3px solid ${s.accent}` }}
                styles={{ body: { padding: '20px 24px 16px' } }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 13, color: '#64748b', marginBottom: 8 }}>{s.title}</div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: '#1e293b', lineHeight: 1 }}>
                      {s.precision ? Number(s.value).toFixed(s.precision) : s.value}
                      <span style={{ fontSize: 13, fontWeight: 400, color: '#94a3b8', marginLeft: 4 }}>{s.suffix}</span>
                    </div>
                  </div>
                  <div style={{
                    width: 42, height: 42, borderRadius: 12,
                    background: `${s.accent}15`, color: s.accent,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                  }}>
                    {s.icon}
                  </div>
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 12 }}>{s.sub}</div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* 图表行 1：营收趋势 + 会员增长（仅 admin/staff 可见） */}
      {(canReport || canMember) && (
        <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
          {canReport && (
            <Col xs={24} lg={canMember ? 14 : 24}>
              <Card
                title={<span style={{ fontWeight: 600, fontSize: 14 }}>近 7 日营收趋势</span>}
                styles={{ body: { padding: '12px 16px' } }}
              >
                <div ref={revChartRef} style={{ height: 280 }} />
              </Card>
            </Col>
          )}
          {canMember && (
            <Col xs={24} lg={canReport ? 10 : 24}>
              <Card
                title={<span style={{ fontWeight: 600, fontSize: 14 }}>近 6 月会员增长</span>}
                styles={{ body: { padding: '12px 16px' } }}
              >
                <div ref={growthRef} style={{ height: 280 }} />
              </Card>
            </Col>
          )}
        </Row>
      )}

      {/* 图表行 2：热门课程 + 库存预警 */}
      {(canCourse || canProduct) && (
        <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
          {canCourse && (
            <Col xs={24} lg={canProduct ? 12 : 24}>
              <Card
                title={<span style={{ fontWeight: 600, fontSize: 14 }}><FireOutlined style={{ color: '#d9534f', marginRight: 6 }} />热门课程 TOP5</span>}
                extra={<Text type="secondary" style={{ fontSize: 12 }}>近 30 天</Text>}
                styles={{ body: { padding: '12px 16px' } }}
              >
                {hotCourses && hotCourses.length > 0
                  ? <div ref={hotRef} style={{ height: 240 }} />
                  : <Empty description="暂无预约数据" style={{ padding: 40 }} />}
              </Card>
            </Col>
          )}
          {canProduct && (
            <Col xs={24} lg={canCourse ? 12 : 24}>
              <Card
                title={<span style={{ fontWeight: 600, fontSize: 14 }}><WarningOutlined style={{ color: '#f0a230', marginRight: 6 }} />库存预警</span>}
                styles={{ body: { padding: stockAlerts.length > 0 ? '8px 0' : '12px 16px' } }}
              >
                {stockAlerts.length > 0 ? (
                  <Table
                    rowKey="id"
                    size="small"
                    pagination={false}
                    dataSource={stockAlerts}
                    columns={[
                      { title: '商品', dataIndex: 'name' },
                      { title: '库存', dataIndex: 'stock', width: 70, render: (v: number) => <span style={{ color: '#d9534f', fontWeight: 600 }}>{v}</span> },
                      { title: '预警线', dataIndex: 'stock_alert', width: 70 },
                      { title: '单位', dataIndex: 'unit', width: 50 },
                    ]}
                  />
                ) : <Empty description="库存充足，无预警" style={{ padding: 40 }} />}
              </Card>
            </Col>
          )}
        </Row>
      )}

      {canMembership && <ExpiringList />}
    </div>
  );
}
