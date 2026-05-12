import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { audit } from '../middleware/audit.js';
import {
  listCoaches, getCoach, createCoach, updateCoach, deleteCoach, coachStats, coachRanking,
} from '../controllers/coachController.js';
import {
  listCourses, createCourse, updateCourse, deleteCourse,
} from '../controllers/courseController.js';
import {
  listSchedules, getSchedule, createSchedule, updateSchedule, cancelSchedule, deleteSchedule,
} from '../controllers/scheduleController.js';
import {
  createBooking, cancelBooking, checkInBooking, noShowBooking, myBookings,
  selfBook, selfCancelBooking,
} from '../controllers/bookingController.js';
import { createReview, listReviews, deleteReview } from '../controllers/reviewController.js';

const router = Router();
router.use(authRequired);

// 教练
router.get('/coaches', requirePermission('course:view'), listCoaches);
router.get('/coaches/ranking', requirePermission('member:view'), coachRanking);
router.get('/coaches/:id', requirePermission('course:view'), getCoach);
router.get('/coaches/:id/stats', requirePermission('member:view'), coachStats);
router.post('/coaches', requirePermission('course:manage'), audit('coach', 'create'), createCoach);
router.put('/coaches/:id', requirePermission('course:manage'), audit('coach', 'update'), updateCoach);
router.delete('/coaches/:id', requirePermission('course:manage'), audit('coach', 'delete'), deleteCoach);

// 课程
router.get('/courses', requirePermission('course:view'), listCourses);
router.post('/courses', requirePermission('course:manage'), audit('course', 'create'), createCourse);
router.put('/courses/:id', requirePermission('course:manage'), audit('course', 'update'), updateCourse);
router.delete('/courses/:id', requirePermission('course:manage'), audit('course', 'delete'), deleteCourse);

// 排期
router.get('/schedules', requirePermission('course:view'), listSchedules);
router.get('/schedules/:id', requirePermission('course:view'), getSchedule);
router.post('/schedules', requirePermission('course:manage'), audit('schedule', 'create'), createSchedule);
router.put('/schedules/:id', requirePermission('course:manage'), audit('schedule', 'update'), updateSchedule);
router.post('/schedules/:id/cancel', requirePermission('course:manage'), audit('schedule', 'cancel'), cancelSchedule);
router.delete('/schedules/:id', requirePermission('course:manage'), audit('schedule', 'delete'), deleteSchedule);

// 预约
router.get('/bookings/my', requirePermission('booking:view'), myBookings);
router.post('/bookings', requirePermission('booking:manage'), audit('booking', 'create'), createBooking);
router.post('/bookings/self', requirePermission('booking:manage'), audit('booking', 'self-book'), selfBook);
router.post('/bookings/:id/cancel', requirePermission('booking:manage'), audit('booking', 'cancel'), cancelBooking);
router.post('/bookings/:id/self-cancel', requirePermission('booking:manage'), audit('booking', 'self-cancel'), selfCancelBooking);
router.post('/bookings/:id/check-in', requirePermission('checkin:manage'), audit('booking', 'check-in'), checkInBooking);
router.post('/bookings/:id/no-show', requirePermission('checkin:manage'), audit('booking', 'no-show'), noShowBooking);

// 评价
router.get('/reviews', requirePermission('course:view'), listReviews);
router.post('/reviews', requirePermission('booking:manage'), audit('review', 'create'), createReview);
router.delete('/reviews/:id', requirePermission('course:manage'), audit('review', 'delete'), deleteReview);

export default router;
