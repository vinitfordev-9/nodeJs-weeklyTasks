import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { validate, idSchema } from '../common/validation.js';
import * as controller from './notification.controller.js';
export const notificationRouter = Router();
notificationRouter.use(authenticate);
notificationRouter.get('/', controller.list);
notificationRouter.patch('/:id/read', validate(idSchema, 'params'), controller.read);
