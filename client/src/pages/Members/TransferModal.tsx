import { Form, message, Modal, Select, Spin } from 'antd';
import { useEffect, useState } from 'react';
import { apiMemberList, apiTransfer, Member, MembershipCard } from '@/api/member';

interface Props {
  open: boolean;
  card: MembershipCard | null;
  onClose: () => void;
  onOk: () => void;
}

export default function TransferModal({ open, card, onClose, onOk }: Props) {
  const [form] = Form.useForm();
  const [options, setOptions] = useState<Member[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => { if (open) { form.resetFields(); setOptions([]); } }, [open]);

  const onSearch = async (kw: string) => {
    if (!kw) return;
    setSearching(true);
    try {
      const res = await apiMemberList({ keyword: kw, pageSize: 20 });
      setOptions(res.list.filter((m) => m.id !== card?.member_id));
    } finally { setSearching(false); }
  };

  const onSubmit = async () => {
    const v = await form.validateFields();
    await apiTransfer(card!.id, v.target);
    message.success('转让成功');
    onOk();
  };

  return (
    <Modal title={`转让会员卡 - ${card?.card_no}`} open={open} onOk={onSubmit} onCancel={onClose} destroyOnClose>
      <Form form={form} layout="vertical" preserve={false}>
        <Form.Item name="target" label="目标会员" rules={[{ required: true }]}>
          <Select
            showSearch
            placeholder="输入姓名/手机/编号搜索"
            filterOption={false}
            onSearch={onSearch}
            notFoundContent={searching ? <Spin size="small" /> : '无匹配'}
            options={options.map((m) => ({
              value: m.id,
              label: `${m.name} · ${m.phone || '无'} · ${m.member_no}`,
            }))}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
