import messagesRepository from "../../../DB/Repositories/messages.repository.js";
import userRepository from "../../../DB/Repositories/user.repository.js";
import { NotFoundError } from "../../../Common/Errors/index.js";

// Public + anonymous: anyone can send a message to a (confirmed) user.
export const sendMessageService = async (req, res) => {
    const { content } = req.body
    const receiverId = req.params.receiverId.toLowerCase()

    const receiver = await userRepository.findOne({ _id: receiverId, isConfirmed: true }, "_id")
    if (!receiver) throw new NotFoundError("User not found")

    await messagesRepository.create({ content, receiverId })
    return res.status(201).json({ message: "message sent successfully" })
}

// Private: a user only ever sees his own messages.
export const getMessagesService = async (req, res) => {
    const { _id } = req.loggedInUser.user
    const page = Math.max(parseInt(req.query.page) || 1, 1)
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100)

    const [messages, total] = await Promise.all([
        messagesRepository.findByReceiver(_id, { page, limit }),
        messagesRepository.countDocuments({ receiverId: _id })
    ])
    return res.status(200).json({ messages, page, limit, total })
}

export const deleteMessageService = async (req, res) => {
    const { _id } = req.loggedInUser.user
    const deleted = await messagesRepository.findOneAndDelete({ _id: req.params.messageId, receiverId: _id })
    if (!deleted) throw new NotFoundError("Message not found")
    return res.status(200).json({ message: "message deleted successfully" })
}
