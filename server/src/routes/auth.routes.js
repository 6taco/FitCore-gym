import { Router } from 'express';
import { login, profile, changePassword, refreshTokenHandler } from '../controllers/authController.js';
import { authRequired } from '../middleware/auth.js';
import { audit } from '../middleware/audit.js';
import { rateLimit } from '../middleware/rateLimit.js';

const loginLimiter = rateLimit(60_000, 10);

const router = Router();

router.post('/login', loginLimiter, audit('auth', 'login'), login);
router.post('/refresh', loginLimiter, refreshTokenHandler);
router.get('/profile', authRequired, profile);
router.post('/change-password', authRequired, audit('auth', 'change-password'), changePassword);

export default router;
