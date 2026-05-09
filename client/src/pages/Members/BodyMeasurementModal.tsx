import { DatePicker, Form, InputNumber, Input, message, Modal } from 'antd';
import dayjs from 'dayjs';
import { useEffect } from 'react';
import { apiMeasurementCreate } from '@/api/member';

interface Props {
  open: boolean;
  memberId: number;
  onClose: () => void;
  onOk: () => void;
}

export default function BodyMeasurementModal({ open, memberId, onClose, onOk }: Props) {
  const [form] = Form.useForm();
  useEffect(() => {
    if (open) {
      form.resetFields();
      form.setFieldsValue({ measured_at: dayjs() });
    }
  }, [open]);

  const onSubmit = async () => {
    const v = await form.validateFields();
    await apiMeasurementCreate(memberId, {
      ...v,
      measured_at: dayjs(v.measured_at).toISOString(),
    });
    message.success('已记录');
    onOk();
  };

  return (
    <Modal title="新增体测记录" open={open} onOk={onSubmit} onCancel={onClose} destroyOnClose>
      <Form form={form} layout="vertical" preserve={false}>
        <Form.Item name="measured_at" label="测量时间" rules={[{ required: true }]}>
          <DatePicker showTime style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="height_cm" label="身高(cm)">
          <InputNumber style={{ width: '100%' }} min={0} max={300} step={0.1} />
        </Form.Item>
        <Form.Item name="weight_kg" label="体重(kg)">
          <InputNumber style={{ width: '100%' }} min={0} max={500} step={0.1} />
        </Form.Item>
        <Form.Item name="body_fat" label="体脂率(%)">
          <InputNumber style={{ width: '100%' }} min={0} max={100} step={0.1} />
        </Form.Item>
        <Form.Item name="muscle_kg" label="肌肉量(kg)">
          <InputNumber style={{ width: '100%' }} min={0} max={200} step={0.1} />
        </Form.Item>
        <Form.Item name="remark" label="备注">
          <Input.TextArea rows={2} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
