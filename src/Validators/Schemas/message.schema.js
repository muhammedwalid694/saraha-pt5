import Joi from "joi";

export const SendMessageSchema = {
  params: Joi.object({
    receiverId: Joi.string().email({ tlds: { allow: false } }).required(),
  }),
  body: Joi.object({
    content: Joi.string().trim().min(1).max(1000).required(),
  }),
};

export const GetMessagesSchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1).max(100),
  }),
};

export const MessageIdSchema = {
  params: Joi.object({
    messageId: Joi.string().hex().length(24).required(),
  }),
};
