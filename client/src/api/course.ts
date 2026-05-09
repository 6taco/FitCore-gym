import request from './request';
import type { PageResult } from './system';
import type { Member } from './member';

export interface Coach {
  id: number;
  user_id?: number;
  name: string;
  gender: number;
  phone?: string;
  avatar?: string;
  specialty?: string;
  intro?: string;
  hire_date?: string;
  status: number;
  created_at: string;
}

export interface Course {
  id: number;
  code: string;
  name: string;
  type: 'GROUP' | 'PERSONAL';
  duration_min: number;
  capacity?: number;
  price?: number;
  description?: string;
  status: number;
  created_at: string;
}

export interface Schedule {
  id: number;
  course_id: number;
  coach_id: number;
  start_time: string;
  end_time: string;
  location?: string;
  capacity: number;
  booked_count: number;
  status: 'OPEN' | 'CLOSED' | 'CANCELLED';
  course?: Course;
  coach?: Coach;
  bookings?: Booking[];
  created_at: string;
}

export interface Booking {
  id: number;
  schedule_id: number;
  member_id: number;
  status: 'BOOKED' | 'CHECKED_IN' | 'CANCELLED' | 'NO_SHOW';
  checked_in_at?: string;
  remark?: string;
  member?: Member;
  schedule?: Schedule;
  created_at: string;
}

export interface CoachStats {
  coach_id: number;
  coach_name: string;
  total_schedules: number;
  total_bookings: number;
  total_checked_in: number;
}

// 教练
export const apiCoachList = (params: { page?: number; pageSize?: number; keyword?: string; status?: number }): Promise<PageResult<Coach>> =>
  request.get('/coaches', { params });
export const apiCoachCreate = (b: any) => request.post('/coaches', b);
export const apiCoachUpdate = (id: number, b: any) => request.put(`/coaches/${id}`, b);
export const apiCoachDelete = (id: number) => request.delete(`/coaches/${id}`);
export const apiCoachStats = (id: number, params?: { start?: string; end?: string }): Promise<CoachStats> =>
  request.get(`/coaches/${id}/stats`, { params });

export interface CoachRankItem {
  coach_id: number;
  coach_name: string;
  specialty?: string;
  avatar?: string;
  total_schedules: number;
  total_bookings: number;
  total_checked_in: number;
  attendance_rate: number;
}

export const apiCoachRanking = (params?: { start?: string; end?: string }): Promise<CoachRankItem[]> =>
  request.get('/coaches/ranking', { params });

// 评价
export interface ReviewItem {
  id: number;
  schedule_id: number;
  member_id: number;
  rating: number;
  content?: string;
  created_at: string;
  member?: { id: number; name: string; member_no: string; avatar?: string };
  schedule?: { id: number; start_time: string; course?: { id: number; name: string }; coach?: { id: number; name: string } };
}

export const apiReviewList = (params?: Record<string, any>): Promise<{ list: ReviewItem[]; total: number }> =>
  request.get('/reviews', { params });
export const apiReviewCreate = (b: { schedule_id: number; member_id: number; rating: number; content?: string }) =>
  request.post('/reviews', b);
export const apiReviewDelete = (id: number) => request.delete(`/reviews/${id}`);

// 课程
export const apiCourseList = (params?: { keyword?: string; type?: string; status?: number }): Promise<Course[]> =>
  request.get('/courses', { params });
export const apiCourseCreate = (b: any) => request.post('/courses', b);
export const apiCourseUpdate = (id: number, b: any) => request.put(`/courses/${id}`, b);
export const apiCourseDelete = (id: number) => request.delete(`/courses/${id}`);

// 排期
export const apiScheduleList = (params: { start: string; end: string; coach_id?: number; course_id?: number }): Promise<Schedule[]> =>
  request.get('/schedules', { params });
export const apiScheduleGet = (id: number): Promise<Schedule> => request.get(`/schedules/${id}`);
export const apiScheduleCreate = (b: any) => request.post('/schedules', b);
export const apiScheduleUpdate = (id: number, b: any) => request.put(`/schedules/${id}`, b);
export const apiScheduleCancel = (id: number) => request.post(`/schedules/${id}/cancel`);
export const apiScheduleDelete = (id: number) => request.delete(`/schedules/${id}`);

// 预约
export const apiBookingCreate = (b: { schedule_id: number; member_id: number; remark?: string }) =>
  request.post('/bookings', b);
export const apiBookingSelfBook = (b: { schedule_id: number }) =>
  request.post('/bookings/self', b);
export const apiBookingCancel = (id: number) => request.post(`/bookings/${id}/cancel`);
export const apiBookingSelfCancel = (id: number) => request.post(`/bookings/${id}/self-cancel`);
export const apiBookingCheckIn = (id: number) => request.post(`/bookings/${id}/check-in`);
export const apiBookingNoShow = (id: number) => request.post(`/bookings/${id}/no-show`);
export const apiMyBookings = (params: { member_id: number; status?: string; upcoming?: string }): Promise<Booking[]> =>
  request.get('/bookings/my', { params });
