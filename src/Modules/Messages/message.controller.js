import { Router } from "express";
import { deleteMessageService, getMessagesService, sendMessageService } from "./Services/message.service.js";
import { authenticationMiddleware } from "../../Middleware/authentication.middleware.js";
import { validationMiddleware } from "../../Middleware/validation.middleware.js";
import { messageLimiter } from "../../Middleware/rate-limit.middleware.js";
import { SendMessageSchema, GetMessagesSchema, MessageIdSchema } from "../../Validators/Schemas/message.schema.js";

const router = Router();

router.post('/send/:receiverId', messageLimiter, validationMiddleware(SendMessageSchema), sendMessageService)
router.get('/', authenticationMiddleware, validationMiddleware(GetMessagesSchema), getMessagesService)
router.delete('/:messageId', authenticationMiddleware, validationMiddleware(MessageIdSchema), deleteMessageService)

export default router
