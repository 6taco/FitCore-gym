import { Form, InputNumber, message, Modal } from 'antd';
import { useEffect } from 'react';
import { apiRenew, MembershipCard } from '@/api/member';

interface Props {
  open: boolean;
  card: MembershipCard | null;
  onClose: () => void;
  onOk: () => void;
}

export default function RenewModal({ open, card, onClose, onOk }: Props) {
  const [form] = Form.useForm();
  useEffect(() => { if (open) form.resetFields(); }, [open]);

  if (!card) return null;
  const type = card.plan?.type;

  const onSubmit = async () => {
    const v = await form.validateFields();
    await apiRenew(card.id, v);
    message.success('续费成功');
    onOk();
  };

  return (
    <Modal title={`续费 - ${card.card_no}`} open={open} onOk={onSubmit} onCancel={onClose} destroyOnClose>
      <Form form={form} layout="vertical" preserve={false}>
        {type === 'PERIOD' && (
          <Form.Item name="days" label="续费天数" rules={[{ required: true }]}>
            <InputNumber min={1} max={3650} style={{ width: '100%' }} />
          </Form.Item>
        )}
        {type === 'COUNT' && (
          <Form.Item name="count" label="续费次数" rules={[{ required: true }]}>
            <InputNumber min={1} max={1000} style={{ width: '100%' }} />
          </Form.Item>
        )}
        {type === 'STORED' && (
          <Form.Item name="amount" label="充值金额" rules={[{ required: true }]}>
            <InputNumber min={0.01} step={0.01} style={{ width: '100%' }} prefix="¥" />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
}
