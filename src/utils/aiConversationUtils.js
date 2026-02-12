import {
  collection,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  where,
} from "firebase/firestore";
import { db } from "@/firebase/config";

/**
 * Get or create the active conversation for a user in an organization
 * This prevents creating multiple conversations - reuses the most recent one
 * @param {string} userId - The user's ID
 * @param {string} organizationId - The organization ID
 * @param {string} organizationName - The organization name
 * @returns {Promise<string>} The conversation ID (existing or new)
 */
export const getOrCreateActiveConversation = async (userId, organizationId, organizationName) => {
  try {
    // Check if there's a recent conversation (within last 24 hours) for this org
    const conversationsRef = collection(db, `users/${userId}/ai_conversations`);
    const recentQuery = query(
      conversationsRef,
      where("organizationId", "==", organizationId),
      orderBy("updatedAt", "desc"),
      limit(1)
    );
    
    const recentSnap = await getDocs(recentQuery);
    
    if (!recentSnap.empty) {
      const recentConv = recentSnap.docs[0];
      const updatedAt = recentConv.data().updatedAt?.toDate();
      const now = new Date();
      const hoursSinceUpdate = (now - updatedAt) / (1000 * 60 * 60);
      
      // If conversation was updated within last 24 hours, reuse it
      if (hoursSinceUpdate < 24) {
        console.log("Reusing recent conversation:", recentConv.id);
        return recentConv.id;
      }
    }
    
    // Otherwise, create a new conversation
    console.log("Creating new conversation for org:", organizationId);
    const newConversationRef = await addDoc(conversationsRef, {
      organizationId,
      organizationName,
      title: "New Conversation",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      messageCount: 0,
      lastMessage: "",
    });
    
    return newConversationRef.id;
  } catch (error) {
    console.error("Error getting/creating active conversation:", error);
    throw error;
  }
};

/**
 * Create a new AI conversation (use this when you explicitly want a NEW conversation)
 * @param {string} userId - The user's ID
 * @param {string} organizationId - The organization ID
 * @param {string} organizationName - The organization name
 * @returns {Promise<string>} The new conversation ID
 */
export const createAIConversation = async (userId, organizationId, organizationName) => {
  try {
    const conversationsRef = collection(db, `users/${userId}/ai_conversations`);
    const newConversationRef = await addDoc(conversationsRef, {
      organizationId,
      organizationName,
      title: "New Conversation",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      messageCount: 0,
      lastMessage: "",
    });
    
    return newConversationRef.id;
  } catch (error) {
    console.error("Error creating AI conversation:", error);
    throw error;
  }
};

/**
 * Save a message to a conversation
 * @param {string} userId - The user's ID
 * @param {string} conversationId - The conversation ID
 * @param {object} message - The message object { text, sender, timestamp, id }
 * @param {boolean} isFirstMessage - Whether this is the first message (to set title)
 */
export const saveMessageToConversation = async (
  userId,
  conversationId,
  message,
  isFirstMessage = false
) => {
  try {
    // Save message to messages subcollection
    const messagesRef = collection(
      db,
      `users/${userId}/ai_conversations/${conversationId}/messages`
    );
    
    await setDoc(doc(messagesRef, message.id), {
      text: message.text,
      sender: message.sender,
      timestamp: message.timestamp instanceof Date 
        ? Timestamp.fromDate(message.timestamp) 
        : serverTimestamp(),
      metadata: message.metadata || null,
    });

    // Update conversation metadata
    const conversationRef = doc(db, `users/${userId}/ai_conversations/${conversationId}`);
    const updateData = {
      updatedAt: serverTimestamp(),
      lastMessage: message.text.substring(0, 100),
    };

    // If this is the first user message, use it as the title
    if (isFirstMessage && message.sender === "user") {
      updateData.title = message.text.substring(0, 60) + (message.text.length > 60 ? "..." : "");
    }

    // Increment message count
    const conversationDoc = await getDoc(conversationRef);
    if (conversationDoc.exists()) {
      updateData.messageCount = (conversationDoc.data().messageCount || 0) + 1;
    }

    await updateDoc(conversationRef, updateData);
  } catch (error) {
    console.error("Error saving message to conversation:", error);
    throw error;
  }
};

/**
 * Load a conversation's messages
 * @param {string} userId - The user's ID
 * @param {string} conversationId - The conversation ID
 * @returns {Promise<Array>} Array of messages
 */
export const loadConversationMessages = async (userId, conversationId) => {
  try {
    const messagesRef = collection(
      db,
      `users/${userId}/ai_conversations/${conversationId}/messages`
    );
    const q = query(messagesRef, orderBy("timestamp", "asc"));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        text: data.text,
        sender: data.sender,
        timestamp: data.timestamp?.toDate() || new Date(),
        metadata: data.metadata,
      };
    });
  } catch (error) {
    console.error("Error loading conversation messages:", error);
    throw error;
  }
};

/**
 * Get all conversations for a user
 * @param {string} userId - The user's ID
 * @param {number} limitCount - Maximum number of conversations to retrieve
 * @returns {Promise<Array>} Array of conversation metadata
 */
export const getUserConversations = async (userId, limitCount = 50) => {
  try {
    const conversationsRef = collection(db, `users/${userId}/ai_conversations`);
    const q = query(conversationsRef, orderBy("updatedAt", "desc"), limit(limitCount));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    }));
  } catch (error) {
    console.error("Error getting user conversations:", error);
    throw error;
  }
};

/**
 * Get a single conversation's metadata
 * @param {string} userId - The user's ID
 * @param {string} conversationId - The conversation ID
 * @returns {Promise<object>} Conversation metadata
 */
export const getConversationMetadata = async (userId, conversationId) => {
  try {
    const conversationRef = doc(db, `users/${userId}/ai_conversations/${conversationId}`);
    const snapshot = await getDoc(conversationRef);

    if (!snapshot.exists()) {
      throw new Error("Conversation not found");
    }

    return {
      id: snapshot.id,
      ...snapshot.data(),
      createdAt: snapshot.data().createdAt?.toDate(),
      updatedAt: snapshot.data().updatedAt?.toDate(),
    };
  } catch (error) {
    console.error("Error getting conversation metadata:", error);
    throw error;
  }
};

/**
 * Delete a conversation and all its messages
 * @param {string} userId - The user's ID
 * @param {string} conversationId - The conversation ID
 */
export const deleteConversation = async (userId, conversationId) => {
  try {
    // Delete all messages first
    const messagesRef = collection(
      db,
      `users/${userId}/ai_conversations/${conversationId}/messages`
    );
    const messagesSnapshot = await getDocs(messagesRef);
    
    const deletePromises = messagesSnapshot.docs.map((doc) => 
      deleteDoc(doc.ref)
    );
    await Promise.all(deletePromises);

    // Delete the conversation document
    const conversationRef = doc(db, `users/${userId}/ai_conversations/${conversationId}`);
    await deleteDoc(conversationRef);
  } catch (error) {
    console.error("Error deleting conversation:", error);
    throw error;
  }
};

/**
 * Start a new conversation explicitly (creates a new one even if recent exists)
 * @param {string} userId - The user's ID
 * @param {string} organizationId - The organization ID
 * @param {string} organizationName - The organization name
 * @returns {Promise<string>} The new conversation ID
 */
export const startNewConversation = async (userId, organizationId, organizationName) => {
  return await createAIConversation(userId, organizationId, organizationName);
};