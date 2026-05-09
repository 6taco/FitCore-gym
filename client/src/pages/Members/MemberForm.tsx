import { Form, Input, InputNumber, Modal, Radio, Select, Switch } from 'antd';
import dayjs from 'dayjs';
import { DatePicker } from 'antd';
import { useEffect, useState } from 'react';
import { GENDER_OPTIONS } from '@/config/dicts';
import { apiMemberCreate, apiMemberUpdate, apiLinkableUsers, Member, LinkableUser } from '@/api/member';
import { message } from 'antd';

interface Props {
  open: boolean;
  editing: Member | null;
  onClose: () => void;
  onOk: () => void;
}

export default function MemberForm({ open, editing, onClose, onOk }: Props) {
  const [form] = Form.useForm();
  const [linkableUsers, setLinkableUsers] = useState<LinkableUser[]>([]);

  const fillForm = () => {
    if (editing) {
      form.setFieldsValue({
        ...editing,
        birthday: editing.birthday ? dayjs(editing.birthday) : undefined,
        status: editing.status,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({ gender: 0, status: 1 });
    }
  };

  useEffect(() => {
    if (open) {
      apiLinkableUsers(editing?.user_id ?? undefined).then(setLinkableUsers).catch(() => {});
      // 延迟一帧确保 Form 字段已挂载
      setTimeout(fillForm, 0);
    }
  }, [open, editing]);

  const onSubmit = async () => {
    const v = await form.validateFields();
    const body = {
      ...v,
      birthday: v.birthday ? dayjs(v.birthday).format('YYYY-MM-DD') : null,
      height_cm: v.height_cm ?? null,
      weight_kg: v.weight_kg ?? null,
      user_id: v.user_id ? Number(v.user_id) : null,
    };
    if (editing) {
      await apiMemberUpdate(editing.id, body);
      message.success('已更新');
    } else {
      await apiMemberCreate(body);
      message.success('已创建');
    }
    onOk();
  };

  return (
    <Modal
      title={editing ? `编辑会员 - ${editing.name}` : '新建会员'}
      open={open}
      onOk={onSubmit}
      onCancel={onClose}
      width={560}
      afterClose={() => form.resetFields()}
    >
      <Form form={form} layout="vertical">
        <Form.Item name="name" label="姓名" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="gender" label="性别">
          <Radio.Group options={GENDER_OPTIONS} optionType="button" />
        </Form.Item>
        <Form.Item name="birthday" label="生日">
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="phone" label="手机">
          <Input />
        </Form.Item>
        <Form.Item name="id_card" label="证件号">
          <Input />
        </Form.Item>
        <Form.Item name="height_cm" label="身高(cm)">
          <InputNumber style={{ width: '100%' }} min={0} max={300} step={0.1} />
        </Form.Item>
        <Form.Item name="weight_kg" label="体重(kg)">
          <InputNumber style={{ width: '100%' }} min={0} max={500} step={0.1} />
        </Form.Item>
        <Form.Item name="tags" label="标签" tooltip="多个标签以逗号分隔">
          <Input placeholder="VIP,减脂" />
        </Form.Item>
        <Form.Item name="user_id" label="关联登录账号" tooltip="关联后该会员可用此账号登录系统自助预约课程">
          <Select
            allowClear placeholder="选择要关联的用户账号（可选）"
            options={linkableUsers.map((u) => ({ value: u.id, label: `${u.username}${u.real_name ? ` (${u.real_name})` : ''}` }))}
          />
        </Form.Item>
        <Form.Item name="remark" label="备注">
          <Input.TextArea rows={2} />
        </Form.Item>
        <Form.Item
          name="status" label="状态" valuePropName="checked"
          getValueProps={(v) => ({ checked: v === 1 })}
          getValueFromEvent={(v) => (v ? 1 : 0)}
        >
          <Switch checkedChildren="启用" unCheckedChildren="停用" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
