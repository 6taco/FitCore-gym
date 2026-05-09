import { useEffect, useState, useMemo } from 'react';
import {
  Row, Col, Card, Table, InputNumber, Button, Select, Space, Tag, message,
  Divider, Input, Modal, Empty, Typography, List, Form,
} from 'antd';
import {
  ShoppingCartOutlined, DeleteOutlined, PlusOutlined, CheckCircleOutlined,
} from '@ant-design/icons';
import { apiProductList, ProductItem, apiCheckout, apiCreatePendingOrder, CheckoutPayload } from '@/api/finance';
import { apiMemberList } from '@/api/member';
import { apiPlanList } from '@/api/member';
import { PAYMENT_METHOD_OPTIONS, paymentMethodLabel } from '@/config/dicts';
import PayQrModal from './PayQrModal';

const { Text, Title } = Typography;

interface CartItem {
  key: string;
  item_type: 'PRODUCT' | 'MEMBERSHIP';
  item_id: number;
  name: string;
  unit_price: number;
  quantity: number;
}

export default function Cashier() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [memberId, setMemberId] = useState<number | null>(null);
  const [keyword, setKeyword] = useState('');
  const [remark, setRemark] = useState('');

  // 支付行
  const [payRows, setPayRows] = useState<{ method: string; amount: number }[]>([{ method: 'CASH', amount: 0 }]);

  // 二维码支付状态
  const [qrOpen, setQrOpen] = useState(false);
  const [qrOrderId, setQrOrderId] = useState<number | null>(null);
  const [qrOrderNo, setQrOrderNo] = useState('');
  const [qrTotal, setQrTotal] = useState(0);
  const [qrMethod, setQrMethod] = useState<'WECHAT' | 'ALIPAY'>('WECHAT');

  useEffect(() => {
    apiProductList({ status: 1, pageSize: 500 }).then((r) => setProducts(r.list)).catch(() => {});
    apiPlanList().then(setPlans).catch(() => {});
    apiMemberList({ page: 1, pageSize: 200 }).then((r: any) => setMembers(r.list || r)).catch(() => {});
  }, []);

  const total = useMemo(() => cart.reduce((s, c) => s + c.unit_price * c.quantity, 0), [cart]);

  const addProduct = (p: ProductItem) => {
    setCart((prev) => {
      const exists = prev.find((c) => c.item_type === 'PRODUCT' && c.item_id === p.id);
      if (exists) {
        return prev.map((c) => c === exists ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { key: `P-${p.id}`, item_type: 'PRODUCT', item_id: p.id, name: p.name, unit_price: Number(p.price), quantity: 1 }];
    });
  };

  const addPlan = (plan: any) => {
    setCart((prev) => {
      const exists = prev.find((c) => c.item_type === 'MEMBERSHIP' && c.item_id === plan.id);
      if (exists) {
        return prev.map((c) => c === exists ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { key: `M-${plan.id}`, item_type: 'MEMBERSHIP', item_id: plan.id, name: plan.name, unit_price: Number(plan.price), quantity: 1 }];
    });
  };

  const removeItem = (key: string) => setCart((prev) => prev.filter((c) => c.key !== key));
  const updateQty = (key: string, qty: number) => setCart((prev) => prev.map((c) => c.key === key ? { ...c, quantity: qty } : c));

  const payTotal = useMemo(() => payRows.reduce((s, r) => s + (r.amount || 0), 0), [payRows]);

  const resetAfterCheckout = () => {
    setCart([]);
    setPayRows([{ method: 'CASH', amount: 0 }]);
    setRemark('');
    setMemberId(null);
    apiProductList({ status: 1, pageSize: 500 }).then((r) => setProducts(r.list)).catch(() => {});
  };

  const handleCheckout = async () => {
    if (!cart.length) return message.warning('购物车为空');
    // 会籍类需要指定会员
    if (cart.some((c) => c.item_type === 'MEMBERSHIP') && !memberId) {
      return message.warning('办卡类项目需选择会员');
    }
    // 自动补全支付金额
    let finalPayRows = payRows;
    if (payRows.length === 1 && payRows[0].amount === 0) {
      finalPayRows = [{ method: payRows[0].method, amount: total }];
    }
    const paySum = finalPayRows.reduce((s, r) => s + r.amount, 0);
    if (Math.abs(paySum - total) > 0.01) {
      return message.warning(`支付合计 ¥${paySum.toFixed(2)} 与应付 ¥${total.toFixed(2)} 不匹配`);
    }

    const payload: CheckoutPayload = {
      member_id: memberId,
      items: cart.map((c) => ({ item_type: c.item_type, item_id: c.item_id, quantity: c.quantity })),
      payments: finalPayRows.map((r) => ({ method: r.method, amount: r.amount })),
      remark: remark || undefined,
    };

    // 判断是否走二维码支付（全部金额为微信或支付宝）
    const qrMethods = finalPayRows.filter((r) => r.method === 'WECHAT' || r.method === 'ALIPAY');
    const isQrPay = qrMethods.length > 0 && finalPayRows.length === 1;

    try {
      if (isQrPay) {
        const res: any = await apiCreatePendingOrder(payload);
        setQrOrderId(res.id);
        setQrOrderNo(res.order_no);
        setQrTotal(Number(res.total_amount));
        setQrMethod(finalPayRows[0].method as 'WECHAT' | 'ALIPAY');
        setQrOpen(true);
      } else {
        const res: any = await apiCheckout(payload);
        Modal.success({
          title: '收银成功',
          content: `订单号：${res.order_no}，金额：¥${res.total_amount}`,
        });
        resetAfterCheckout();
      }
    } catch { /* handled by interceptor */ }
  };

  const filteredProducts = products.filter((p) =>
    !keyword || p.name.includes(keyword) || p.code.includes(keyword)
  );

  const productGridStyle: React.CSSProperties = {
    width: 130, padding: 12, cursor: 'pointer', textAlign: 'center',
    borderRadius: 10, border: '1px solid #f0f0f0', background: '#fff',
    transition: 'all 0.2s',
  };

  return (
    <>
    <Row gutter={20}>
      {/* 左：商品选择 */}
      <Col xs={24} lg={14}>
        <Card
          title={<span style={{ fontWeight: 600 }}>商品</span>}
          extra={<Input.Search placeholder="搜索商品" allowClear size="small" style={{ width: 200 }} onSearch={setKeyword} />}
          styles={{ body: { padding: '16px 20px' } }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, maxHeight: 320, overflow: 'auto' }}>
            {filteredProducts.map((p) => (
              <div
                key={p.id}
                style={productGridStyle}
                onClick={() => addProduct(p)}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#4f6f8f'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#f0f0f0'; e.currentTarget.style.transform = 'none'; }}
              >
                <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b', marginBottom: 4 }}>{p.name}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#4f6f8f' }}>¥{p.price}</div>
                <div style={{ fontSize: 11, color: p.stock > 0 ? '#94a3b8' : '#d9534f', marginTop: 4 }}>
                  {p.stock > 0 ? `库存 ${p.stock} ${p.unit || '件'}` : '缺货'}
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card
          title={<span style={{ fontWeight: 600 }}>办卡 / 会籍</span>}
          style={{ marginTop: 16 }}
          styles={{ body: { padding: '16px 20px' } }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {plans.filter((p: any) => p.status === 1).map((p: any) => (
              <div
                key={p.id}
                style={{ ...productGridStyle, borderColor: '#e8f0e8', background: '#f8fbf8' }}
                onClick={() => addPlan(p)}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#5cb85c'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e8f0e8'; e.currentTarget.style.transform = 'none'; }}
              >
                <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b', marginBottom: 4 }}>{p.name}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#5cb85c' }}>¥{p.price}</div>
              </div>
            ))}
          </div>
        </Card>
      </Col>

      {/* 右：购物车 & 支付 */}
      <Col xs={24} lg={10}>
        <Card
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShoppingCartOutlined style={{ fontSize: 16 }} />
              <span style={{ fontWeight: 600 }}>购物车</span>
              {cart.length > 0 && (
                <Tag color="#4f6f8f" style={{ borderRadius: 10, fontSize: 11 }}>{cart.length}</Tag>
              )}
            </div>
          }
          styles={{ body: { padding: '16px 20px' } }}
        >
          {cart.length === 0 ? (
            <Empty description="请从左侧选择商品或卡种" style={{ padding: '40px 0' }} />
          ) : (
            <List
              size="small"
              dataSource={cart}
              renderItem={(item) => (
                <List.Item
                  style={{ padding: '10px 0' }}
                  actions={[
                    <InputNumber size="small" min={1} value={item.quantity} onChange={(v) => updateQty(item.key, v || 1)} style={{ width: 60 }} />,
                    <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => removeItem(item.key)} />,
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <span style={{ fontSize: 13 }}>
                        {item.name}
                        <Tag color={item.item_type === 'PRODUCT' ? '#4f6f8f' : '#5cb85c'} style={{ marginLeft: 8, fontSize: 11 }}>
                          {item.item_type === 'PRODUCT' ? '商品' : '会籍'}
                        </Tag>
                      </span>
                    }
                    description={
                      <span style={{ fontSize: 12 }}>
                        ¥{item.unit_price} × {item.quantity} = <b style={{ color: '#1e293b' }}>¥{(item.unit_price * item.quantity).toFixed(2)}</b>
                      </span>
                    }
                  />
                </List.Item>
              )}
            />
          )}

          <Divider style={{ margin: '12px 0' }} />

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#475569', marginBottom: 6 }}>关联会员</div>
            <Select
              showSearch
              allowClear
              placeholder="选择会员(可选)"
              style={{ width: '100%' }}
              value={memberId}
              onChange={setMemberId}
              filterOption={(input, opt: any) =>
                (opt?.children as string)?.toLowerCase().includes(input.toLowerCase())
              }
            >
              {members.map((m: any) => (
                <Select.Option key={m.id} value={m.id}>
                  {m.name} ({m.member_no}) {m.phone}
                </Select.Option>
              ))}
            </Select>
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#475569', marginBottom: 6 }}>支付方式</div>
            {payRows.map((r, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'center' }}>
                <Select value={r.method} onChange={(v) => {
                  const nw = [...payRows]; nw[i] = { ...nw[i], method: v }; setPayRows(nw);
                }} style={{ width: 120 }}>
                  {PAYMENT_METHOD_OPTIONS.map((o) => <Select.Option key={o.value} value={o.value}>{o.label}</Select.Option>)}
                </Select>
                <InputNumber
                  value={r.amount}
                  min={0}
                  precision={2}
                  style={{ flex: 1 }}
                  placeholder="金额"
                  onChange={(v) => { const nw = [...payRows]; nw[i] = { ...nw[i], amount: v || 0 }; setPayRows(nw); }}
                />
                {payRows.length > 1 && (
                  <Button size="small" type="text" danger onClick={() => setPayRows(payRows.filter((_, j) => j !== i))}>✕</Button>
                )}
              </div>
            ))}
            <Button
              type="dashed"
              size="small"
              icon={<PlusOutlined />}
              style={{ marginTop: 2 }}
              onClick={() => setPayRows([...payRows, { method: 'CASH', amount: 0 }])}
            >
              添加支付方式
            </Button>
          </div>

          <Input.TextArea
            rows={1}
            placeholder="备注（可选）"
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            style={{ marginBottom: 16, borderRadius: 8 }}
          />

          <div
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '16px 20px', margin: '-0px -20px -16px',
              background: '#f8fafc', borderTop: '1px solid #f0f0f0', borderRadius: '0 0 12px 12px',
            }}
          >
            <div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>应付金额</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#d9534f', lineHeight: 1.1 }}>¥{total.toFixed(2)}</div>
            </div>
            <Button
              type="primary"
              size="large"
              icon={<CheckCircleOutlined />}
              onClick={handleCheckout}
              disabled={!cart.length}
              style={{ height: 48, paddingInline: 32, borderRadius: 10, fontWeight: 600 }}
            >
              结 账
            </Button>
          </div>
        </Card>
      </Col>
    </Row>

      <PayQrModal
        open={qrOpen}
        orderId={qrOrderId}
        orderNo={qrOrderNo}
        totalAmount={qrTotal}
        payMethod={qrMethod}
        onSuccess={() => {
          setQrOpen(false);
          resetAfterCheckout();
          message.success('支付成功');
        }}
        onCancel={() => setQrOpen(false)}
      />
    </>
  );
}
