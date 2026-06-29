const Message = require('../models/Message');
const User = require('../models/User');
const Chat = require('../models/Chat');

exports.sendMessage = async (req, res) => {
  const { content, nonce, chatId, replyTo } = req.body;

  if (!content || !chatId || !nonce) {
    console.log('Invalid data passed into request');
    return res.sendStatus(400);
  }

  var newMessage = {
    sender: req.user._id,
    content: content,
    nonce: nonce,
    chat: chatId,
    replyTo: replyTo || null,
    deliveredTo: [req.user._id],
    readBy: [req.user._id]
  };

  try {
    var message = await Message.create(newMessage);

    message = await message.populate('sender', 'username profilePic publicKey');
    message = await message.populate('chat');
    message = await message.populate('replyTo');
    
    // Populate the replyTo sender specifically if it exists
    if (message.replyTo) {
      message = await User.populate(message, {
        path: 'replyTo.sender',
        select: 'username profilePic publicKey'
      });
    }

    message = await User.populate(message, {
      path: 'chat.users',
      select: 'username profilePic email publicKey',
    });

    await Chat.findByIdAndUpdate(req.body.chatId, { latestMessage: message });

    res.json(message);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.allMessages = async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate('sender', 'username profilePic email publicKey')
      .populate('chat')
      .populate('replyTo')
      .populate({
         path: 'replyTo',
         populate: { path: 'sender', select: 'username profilePic publicKey' }
      });
    res.json(messages);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized to delete this message' });
    }

    message.isDeleted = true;
    message.content = "This message was deleted"; // Obfuscate content
    message.nonce = "deleted";
    await message.save();

    res.json(message);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.reactToMessage = async (req, res) => {
  try {
    const { emoji } = req.body;
    const message = await Message.findById(req.params.messageId);
    
    if (!message) return res.status(404).json({ message: 'Message not found' });

    // Check if user already reacted with this emoji
    const existingReaction = message.reactions.find(
      r => r.user.toString() === req.user._id.toString() && r.emoji === emoji
    );

    if (existingReaction) {
      // Remove reaction
      message.reactions = message.reactions.filter(
        r => !(r.user.toString() === req.user._id.toString() && r.emoji === emoji)
      );
    } else {
      // Add reaction
      message.reactions.push({ emoji, user: req.user._id });
    }

    await message.save();
    const updatedMessage = await Message.findById(req.params.messageId)
      .populate('reactions.user', 'username profilePic');

    res.json(updatedMessage);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
