import { DatePicker, Form, Input, InputNumber, Modal, Select, message } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import {
  apiCourseList, apiCoachList, apiScheduleCreate, apiScheduleUpdate,
  Course, Coach, Schedule,
} from '@/api/course';
import { courseTypeLabel } from '@/config/dicts';

interface Props {
  open: boolean;
  defaultStart?: string;
  editData?: Schedule | null;
  onClose: () => void;
  onOk: () => void;
}

export default function ScheduleForm({ open, defaultStart, editData, onClose, onOk }: Props) {
  const [form] = Form.useForm();
  const [courses, setCourses] = useState<Course[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const isEdit = !!editData;

  useEffect(() => {
    if (!open) return;
    Promise.all([
      apiCourseList({ status: 1 }),
      apiCoachList({ pageSize: 100, status: 1 }),
    ]).then(([cs, co]) => {
      setCourses(cs);
      setCoaches(co.list);
    });
    form.resetFields();
    if (editData) {
      form.setFieldsValue({
        course_id: editData.course_id,
        coach_id: editData.coach_id,
        start_time: dayjs(editData.start_time),
        location: editData.location || '',
        capacity: editData.capacity,
      });
    } else {
      form.setFieldsValue({
        start_time: defaultStart ? dayjs(defaultStart) : dayjs().add(1, 'hour').startOf('hour'),
      });
    }
  }, [open]);

  const onSubmit = async () => {
    const v = await form.validateFields();
    if (isEdit) {
      await apiScheduleUpdate(editData!.id, {
        coach_id: v.coach_id,
        start_time: dayjs(v.start_time).toISOString(),
        location: v.location || null,
        capacity: v.capacity || null,
      });
      message.success('排期已更新');
    } else {
      await apiScheduleCreate({
        course_id: v.course_id,
        coach_id: v.coach_id,
        start_time: dayjs(v.start_time).toISOString(),
        location: v.location || null,
        capacity: v.capacity || null,
      });
      message.success('排课成功');
    }
    onOk();
  };

  return (
    <Modal title={isEdit ? '编辑排期' : '新建排期'} open={open} onOk={onSubmit} onCancel={onClose} destroyOnClose>
      <Form form={form} layout="vertical" preserve={false}>
        <Form.Item name="course_id" label="课程" rules={[{ required: true }]}>
          <Select
            showSearch optionFilterProp="label"
            placeholder="选择课程"
            disabled={isEdit}
            options={courses.map((c) => ({
              value: c.id,
              label: `${c.name} · ${courseTypeLabel(c.type)} · ${c.duration_min} 分钟`,
            }))}
          />
        </Form.Item>
        <Form.Item name="coach_id" label="教练" rules={[{ required: true }]}>
          <Select
            showSearch optionFilterProp="label"
            placeholder="选择教练"
            options={coaches.map((c) => ({ value: c.id, label: c.name }))}
          />
        </Form.Item>
        <Form.Item name="start_time" label="开始时间" rules={[{ required: true }]}>
          <DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} minuteStep={5} />
        </Form.Item>
        <Form.Item name="location" label="场地"><Input placeholder="例如：团课室 A" /></Form.Item>
        <Form.Item name="capacity" label="容量（留空则沿用课程默认）">
          <InputNumber style={{ width: '100%' }} min={1} max={200} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
