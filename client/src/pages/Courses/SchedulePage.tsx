import { useEffect, useMemo, useState } from 'react';
import { Button, Card, DatePicker, Select, Space, Tag, Tooltip, Typography } from 'antd';
import { LeftOutlined, RightOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import {
  apiScheduleList, apiCoachList, Schedule, Coach,
} from '@/api/course';
import { courseTypeLabel, SCHEDULE_STATUS } from '@/config/dicts';
import Can from '@/components/Can';
import { useAuthStore } from '@/stores/authStore';
import ScheduleForm from './ScheduleForm';
import ScheduleDrawer from './ScheduleDrawer';

dayjs.extend(isoWeek);

const { Text } = Typography;

const HOURS = Array.from({ length: 15 }, (_, i) => i + 7); // 7:00 - 21:00

export default function SchedulePage() {
  const [weekStart, setWeekStart] = useState<Dayjs>(dayjs().startOf('isoWeek'));
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [coachId, setCoachId] = useState<number | undefined>();
  const [formOpen, setFormOpen] = useState(false);
  const [formDefaultStart, setFormDefaultStart] = useState<string | undefined>();
  const [drawerId, setDrawerId] = useState<number | null>(null);

  const weekEnd = weekStart.add(7, 'day');
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => weekStart.add(i, 'day')), [weekStart]);

  const load = async () => {
    const res = await apiScheduleList({
      start: weekStart.toISOString(),
      end: weekEnd.toISOString(),
      coach_id: coachId,
    });
    setSchedules(res);
  };

  useEffect(() => { load(); }, [weekStart, coachId]);
  useEffect(() => { apiCoachList({ pageSize: 100, status: 1 }).then((r) => setCoaches(r.list)); }, []);

  const byDay = useMemo(() => {
    const map: Record<string, Schedule[]> = {};
    for (const s of schedules) {
      if (s.status === 'CANCELLED') continue;
      const key = dayjs(s.start_time).format('YYYY-MM-DD');
      (map[key] ||= []).push(s);
    }
    return map;
  }, [schedules]);

  const canManageCourse = useAuthStore((s) => s.hasPermission)('course:manage');

  const openCreate = (date?: Dayjs, hour?: number) => {
    if (!canManageCourse) return;
    setFormDefaultStart(date && hour !== undefined ? date.hour(hour).minute(0).toISOString() : undefined);
    setFormOpen(true);
  };

  return (
    <Card
      title="课表"
      extra={
        <Space>
          <Button icon={<LeftOutlined />} onClick={() => setWeekStart(weekStart.subtract(1, 'week'))} />
          <DatePicker
            picker="week" value={weekStart} allowClear={false}
            onChange={(v) => v && setWeekStart(v.startOf('isoWeek'))}
            format={(v) => `${v.format('YYYY')} 第 ${v.isoWeek()} 周 · ${v.format('MM-DD')} 起`}
          />
          <Button icon={<RightOutlined />} onClick={() => setWeekStart(weekStart.add(1, 'week'))} />
          <Button onClick={() => setWeekStart(dayjs().startOf('isoWeek'))}>本周</Button>
          <Select
            allowClear placeholder="教练筛选" style={{ width: 140 }}
            value={coachId} onChange={setCoachId}
            options={coaches.map((c) => ({ value: c.id, label: c.name }))}
          />
          <Can code="course:manage">
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openCreate()}>新建排期</Button>
          </Can>
        </Space>
      }
    >
      <div style={{ overflowX: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '60px repeat(7, minmax(140px, 1fr))', border: '1px solid #f0f0f0', borderRadius: 8 }}>
          {/* header */}
          <div style={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0', padding: 8 }}> </div>
          {days.map((d) => {
            const isToday = d.isSame(dayjs(), 'day');
            return (
              <div key={d.format()} style={{ background: isToday ? '#e6f4ff' : '#fafafa', borderBottom: '1px solid #f0f0f0', borderLeft: '1px solid #f0f0f0', padding: 8, textAlign: 'center' }}>
                <div style={{ fontWeight: 500 }}>{['一', '二', '三', '四', '五', '六', '日'][d.isoWeekday() - 1]}</div>
                <Text type={isToday ? 'success' : 'secondary'} style={{ fontSize: 12 }}>{d.format('MM-DD')}</Text>
              </div>
            );
          })}

          {/* rows */}
          {HOURS.map((h) => (
            <>
              <div key={`h-${h}`} style={{ padding: 8, borderBottom: '1px solid #f5f5f5', color: '#999', fontSize: 12 }}>{`${h}:00`}</div>
              {days.map((d) => {
                const list = (byDay[d.format('YYYY-MM-DD')] || []).filter((s) => dayjs(s.start_time).hour() === h);
                return (
                  <div key={`${d.format()}-${h}`} style={{ minHeight: 70, borderBottom: '1px solid #f5f5f5', borderLeft: '1px solid #f5f5f5', padding: 4, position: 'relative' }}
                    onDoubleClick={() => openCreate(d, h)}
                  >
                    {list.map((s) => {
                      const color = s.status === 'CANCELLED' ? '#ff4d4f' : s.course?.type === 'PERSONAL' ? '#722ed1' : '#1677ff';
                      const full = s.capacity && s.booked_count >= s.capacity;
                      return (
                        <Tooltip key={s.id} title={`${s.course?.name} · ${s.coach?.name} · ${s.booked_count}/${s.capacity}`}>
                          <div
                            onClick={() => setDrawerId(s.id)}
                            style={{
                              padding: 6, borderRadius: 4, marginBottom: 4, cursor: 'pointer',
                              background: color, color: '#fff', fontSize: 12, lineHeight: 1.4,
                              opacity: s.status === 'CANCELLED' ? 0.5 : 1,
                            }}
                          >
                            <div style={{ fontWeight: 500 }}>{dayjs(s.start_time).format('HH:mm')} {s.course?.name}</div>
                            <div>{s.coach?.name} · {s.booked_count}/{s.capacity} {full && <Tag color="red" style={{ marginLeft: 4 }}>满</Tag>}</div>
                          </div>
                        </Tooltip>
                      );
                    })}
                  </div>
                );
              })}
            </>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 12, color: '#888', fontSize: 12 }}>
        提示：双击空白单元格快速新建排期 · 点击色块查看预约与签到
      </div>

      <ScheduleForm open={formOpen} defaultStart={formDefaultStart} onClose={() => setFormOpen(false)} onOk={() => { setFormOpen(false); load(); }} />
      <ScheduleDrawer open={drawerId !== null} scheduleId={drawerId} onClose={() => setDrawerId(null)} onChanged={load} />
    </Card>
  );
}
