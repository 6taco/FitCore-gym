import { DatePicker, Form, message, Modal, Select } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { apiIssue, apiPlanList, MembershipPlan } from '@/api/member';
import { planTypeLabel } from '@/config/dicts';

interface Props {
  open: boolean;
  memberId: number;
  onClose: () => void;
  onOk: () => void;
}

export default function IssueCardModal({ open, memberId, onClose, onOk }: Props) {
  const [form] = Form.useForm();
  const [plans, setPlans] = useState<MembershipPlan[]>([]);

  useEffect(() => {
    if (!open) return;
    apiPlanList({ status: 1 }).then(setPlans);
    form.resetFields();
    form.setFieldsValue({ start_date: dayjs() });
  }, [open]);

  const onSubmit = async () => {
    const v = await form.validateFields();
    await apiIssue({
      member_id: memberId,
      plan_id: v.plan_id,
      start_date: dayjs(v.start_date).format('YYYY-MM-DD'),
    });
    message.success('办卡成功');
    onOk();
  };

  return (
    <Modal title="办理会员卡" open={open} onOk={onSubmit} onCancel={onClose} destroyOnClose>
      <Form form={form} layout="vertical" preserve={false}>
        <Form.Item name="plan_id" label="选择卡种" rules={[{ required: true }]}>
          <Select
            placeholder="请选择卡种"
            options={plans.map((p) => ({
              value: p.id,
              label: `${p.name} · ${planTypeLabel(p.type)} · ¥${p.price}`,
            }))}
          />
        </Form.Item>
        <Form.Item name="start_date" label="开卡日期" rules={[{ required: true }]}>
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
