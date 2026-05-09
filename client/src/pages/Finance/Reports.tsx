import { useEffect, useRef, useState } from 'react';
import {
  Card, Row, Col, Statistic, DatePicker, Segmented, Space, Table, Spin,
} from 'antd';
import { DollarOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import * as echarts from 'echarts/core';
import { BarChart, LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import dayjs from 'dayjs';
import {
  apiDailySummary, apiMonthlySummary, DailySummary, MonthlySummary,
} from '@/api/finance';
import { paymentMethodLabel } from '@/config/dicts';

echarts.use([BarChart, LineChart, GridComponent, TooltipComponent, CanvasRenderer]);

export default function Reports() {
  const [mode, setMode] = useState<'daily' | 'monthly'>('daily');
  const [date, setDate] = useState(dayjs());
  const [daily, setDaily] = useState<DailySummary | null>(null);
  const [monthly, setMonthly] = useState<MonthlySummary | null>(null);
  const [loading, setLoading] = useState(false);
  const trendRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts>();

  useEffect(() => {
    setLoading(true);
    if (mode === 'daily') {
      apiDailySummary(date.format('YYYY-MM-DD')).then(setDaily).finally(() => setLoading(false));
    } else {
      apiMonthlySummary(date.format('YYYY-MM')).then(setMonthly).finally(() => setLoading(false));
    }
  }, [mode, date]);

  useEffect(() => {
    if (mode !== 'monthly' || !monthly?.dailyTrend?.length || !trendRef.current) return;
    if (!chartRef.current) chartRef.current = echarts.init(trendRef.current);
    chartRef.current.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: monthly.dailyTrend.map((d: any) => d.date.slice(5)) },
      yAxis: [
        { type: 'value', name: '营收(元)' },
        { type: 'value', name: '订单数', splitLine: { show: false } },
      ],
      series: [
        { type: 'bar', name: '营收', data: monthly.dailyTrend.map((d: any) => Number(d.revenue)), itemStyle: { color: '#4f6f8f', borderRadius: [3, 3, 0, 0] } },
        { type: 'line', name: '订单', yAxisIndex: 1, data: monthly.dailyTrend.map((d: any) => d.count), smooth: true, itemStyle: { color: '#f0a230' } },
      ],
      grid: { top: 40, bottom: 30, left: 55, right: 55 },
    }, true);
    const onResize = () => chartRef.current?.resize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [monthly, mode]);

  const statStyle = (accent: string) => ({
    borderTop: `3px solid ${accent}`,
  });

  return (
    <div>
      <div className="page-header">
        <h4>财务报表</h4>
        <Space>
          <Segmented
            value={mode}
            onChange={(v) => setMode(v as any)}
            options={[
              { label: '日报', value: 'daily' },
              { label: '月报', value: 'monthly' },
            ]}
          />
          {mode === 'daily' ? (
            <DatePicker value={date} onChange={(d) => d && setDate(d)} />
          ) : (
            <DatePicker.MonthPicker value={date} onChange={(d) => d && setDate(d)} />
          )}
        </Space>
      </div>

      <Spin spinning={loading}>
        {mode === 'daily' && daily && (
          <>
            <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
              <Col xs={24} sm={8}>
                <Card className="stat-card" style={statStyle('#4f6f8f')}>
                  <Statistic title="总营收" value={daily.totalRevenue} prefix={<DollarOutlined />} suffix="元" precision={2} />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card className="stat-card" style={statStyle('#5cb85c')}>
                  <Statistic title="净收入" value={daily.netRevenue} prefix={<DollarOutlined />} suffix="元" precision={2} valueStyle={{ color: daily.netRevenue >= 0 ? '#5cb85c' : '#d9534f' }} />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card className="stat-card" style={statStyle('#f0a230')}>
                  <Statistic title="订单数 / 退款" value={daily.orderCount} suffix={<span style={{ fontSize: 14, color: '#94a3b8' }}> / {daily.refundCount} 退</span>} prefix={<ShoppingCartOutlined />} />
                </Card>
              </Col>
            </Row>
            <Card
              title={<span style={{ fontWeight: 600, fontSize: 14 }}>支付方式汇总</span>}
              styles={{ body: { padding: 0 } }}
            >
              <Table
                rowKey="method"
                size="small"
                pagination={false}
                dataSource={daily.paymentMethods}
                columns={[
                  { title: '支付方式', dataIndex: 'method', render: paymentMethodLabel },
                  { title: '金额', dataIndex: 'total', render: (v) => `¥${Number(v).toFixed(2)}` },
                ]}
              />
            </Card>
          </>
        )}

        {mode === 'monthly' && monthly && (
          <>
            <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
              <Col xs={24} sm={8}>
                <Card className="stat-card" style={statStyle('#4f6f8f')}>
                  <Statistic title="月总营收" value={monthly.totalRevenue} prefix={<DollarOutlined />} suffix="元" precision={2} />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card className="stat-card" style={statStyle('#5cb85c')}>
                  <Statistic title="月净收入" value={monthly.netRevenue} prefix={<DollarOutlined />} suffix="元" precision={2} valueStyle={{ color: monthly.netRevenue >= 0 ? '#5cb85c' : '#d9534f' }} />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card className="stat-card" style={statStyle('#f0a230')}>
                  <Statistic title="月订单数" value={monthly.orderCount} prefix={<ShoppingCartOutlined />} />
                </Card>
              </Col>
            </Row>
            <Card title={<span style={{ fontWeight: 600, fontSize: 14 }}>每日营收趋势</span>}>
              <div ref={trendRef} style={{ height: 300 }} />
            </Card>
          </>
        )}
      </Spin>
    </div>
  );
}
