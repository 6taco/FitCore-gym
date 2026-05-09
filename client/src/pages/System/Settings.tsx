import { useEffect, useState } from 'react';
import { Card, Form, Input, Button, Tabs, message, Spin } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { apiSettings, apiUpdateSettings, SettingItem } from '@/api/settings';

const GROUP_LABELS: Record<string, string> = {
  general: '基本设置',
  notification: '通知设置',
  checkin: '签到设置',
};

export default function SettingsPage() {
  const [groups, setGroups] = useState<Record<string, SettingItem[]>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiSettings();
      setGroups(data);
      const values: Record<string, string> = {};
      for (const items of Object.values(data)) {
        for (const it of items) values[it.key] = it.value;
      }
      form.setFieldsValue(values);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const onSave = async () => {
    setSaving(true);
    try {
      const values = form.getFieldsValue();
      await apiUpdateSettings(values);
      message.success('设置已保存');
    } finally { setSaving(false); }
  };

  const tabItems = Object.entries(groups).map(([group, items]) => ({
    key: group,
    label: GROUP_LABELS[group] || group,
    children: (
      <div style={{ maxWidth: 480 }}>
        {items.map((it) => (
          <Form.Item key={it.key} name={it.key} label={it.label}>
            <Input />
          </Form.Item>
        ))}
      </div>
    ),
  }));

  return (
    <>
      <div className="page-header">
        <h4>系统设置</h4>
        <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={onSave}>保存</Button>
      </div>
      <Card>
        <Spin spinning={loading}>
          <Form form={form} layout="vertical">
            <Tabs items={tabItems} />
          </Form>
        </Spin>
      </Card>
    </>
  );
}
