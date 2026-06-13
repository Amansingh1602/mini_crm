import { Router } from 'express';
import { z } from 'zod';
import { AuthController } from '../controllers/auth.controller';
import { asyncHandler, validate } from '../middleware/error';
import { auth } from '../middleware/auth';

const router = Router();

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const googleLoginSchema = z.object({
  credential: z.string().min(1, 'Google credential token is required'),
});

router.post('/signup', validate(signupSchema), asyncHandler(AuthController.signup));
router.post('/login', validate(loginSchema), asyncHandler(AuthController.login));
router.post('/google', validate(googleLoginSchema), asyncHandler(AuthController.googleLogin));
router.get('/me', auth, asyncHandler(AuthController.getMe));

export default router;
