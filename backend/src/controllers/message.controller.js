import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import Message from "../models/Message.js";
import User from "../models/User.js";

export const getAllContacts = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.log("Error in getAllContacts:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getMessagesByUserId = async (req, res) => {
  try {
    const myId = req.user._id;
    const { id: userToChatId } = req.params;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image, voice, voiceDuration, replyTo } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    if (!text && !image && !voice) {
      return res.status(400).json({ message: "Text, image, or voice message is required." });
    }
    if (senderId.equals(receiverId)) {
      return res.status(400).json({ message: "Cannot send messages to yourself." });
    }
    const receiverExists = await User.exists({ _id: receiverId });
    if (!receiverExists) {
      return res.status(404).json({ message: "Receiver not found." });
    }

    let imageUrl, voiceUrl;
    if (image) {
      // upload base64 image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    if (voice) {
      // upload base64 voice message to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(voice, {
        resource_type: "auto"
      });
      voiceUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
      voice: voiceUrl,
      voiceDuration: voiceDuration || 0,
      replyTo: replyTo || null,
    });

    await newMessage.save();

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getChatPartners = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    // find all the messages where the logged-in user is either sender or receiver
    const messages = await Message.find({
      $or: [{ senderId: loggedInUserId }, { receiverId: loggedInUserId }],
    });

    const chatPartnerIds = [
      ...new Set(
        messages.map((msg) =>
          msg.senderId.toString() === loggedInUserId.toString()
            ? msg.receiverId.toString()
            : msg.senderId.toString()
        )
      ),
    ];

    const chatPartners = await User.find({ _id: { $in: chatPartnerIds } }).select("-password");

    res.status(200).json(chatPartners);
  } catch (error) {
    console.error("Error in getChatPartners: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const addReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { type } = req.body;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Check if user already reacted
    const existingReaction = message.reactions.find(
      (reaction) => reaction.userId.toString() === userId.toString()
    );

    if (existingReaction) {
      if (existingReaction.type === type) {
        // Remove reaction if same type
        message.reactions = message.reactions.filter(
          (reaction) => reaction.userId.toString() !== userId.toString()
        );
      } else {
        // Update reaction type
        existingReaction.type = type;
      }
    } else {
      // Add new reaction
      message.reactions.push({ userId, type });
    }

    await message.save();

    // Emit to both sender and receiver
    const receiverSocketId = getReceiverSocketId(message.receiverId);
    const senderSocketId = getReceiverSocketId(message.senderId);

    // Always emit to receiver if they're online
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageReaction", {
        messageId,
        reactions: message.reactions,
        updatedBy: userId.toString()
      });
    }

    // Always emit to sender if they're online and different from receiver
    if (senderSocketId && senderSocketId !== receiverSocketId) {
      io.to(senderSocketId).emit("messageReaction", {
        messageId,
        reactions: message.reactions,
        updatedBy: userId.toString()
      });
    }

    res.status(200).json(message);
  } catch (error) {
    console.error("Error in addReaction: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Check if user is the sender
    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "You can only edit your own messages" });
    }

    // Check if message is within 15 minutes
    const fifteenMinutes = 15 * 60 * 1000;
    const messageAge = Date.now() - message.createdAt.getTime();
    if (messageAge > fifteenMinutes) {
      return res.status(400).json({ message: "Message can only be edited within 15 minutes" });
    }

    message.text = text;
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();

    // Emit to both sender and receiver
    const receiverSocketId = getReceiverSocketId(message.receiverId);
    const senderSocketId = getReceiverSocketId(message.senderId);

    // Always emit to receiver if they're online
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageEdited", {
        ...message.toObject(),
        updatedBy: userId.toString()
      });
    }

    // Always emit to sender if they're online and different from receiver
    if (senderSocketId && senderSocketId !== receiverSocketId) {
      io.to(senderSocketId).emit("messageEdited", {
        ...message.toObject(),
        updatedBy: userId.toString()
      });
    }

    res.status(200).json(message);
  } catch (error) {
    console.error("Error in editMessage: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Check if user is the sender
    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "You can only delete your own messages" });
    }

    // Check if message is within 15 minutes
    const fifteenMinutes = 15 * 60 * 1000;
    const messageAge = Date.now() - message.createdAt.getTime();
    if (messageAge > fifteenMinutes) {
      return res.status(400).json({ message: "Message can only be deleted within 15 minutes" });
    }

    message.isDeleted = true;
    message.deletedAt = new Date();
    message.text = "This message was deleted";
    message.image = null;
    await message.save();

    // Emit to both sender and receiver
    const receiverSocketId = getReceiverSocketId(message.receiverId);
    const senderSocketId = getReceiverSocketId(message.senderId);

    // Always emit to receiver if they're online
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageDeleted", {
        ...message.toObject(),
        updatedBy: userId.toString()
      });
    }

    // Always emit to sender if they're online and different from receiver
    if (senderSocketId && senderSocketId !== receiverSocketId) {
      io.to(senderSocketId).emit("messageDeleted", {
        ...message.toObject(),
        updatedBy: userId.toString()
      });
    }

    res.status(200).json(message);
  } catch (error) {
    console.error("Error in deleteMessage: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
