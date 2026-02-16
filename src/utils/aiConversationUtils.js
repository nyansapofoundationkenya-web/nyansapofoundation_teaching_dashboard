import {
  collection,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  deleteDoc,
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
 */
export const getOrCreateActiveConversation = async (userId, organizationId, organizationName) => {
  if (!userId || !organizationId) {
    throw new Error("userId and organizationId are required");
  }

  try {
    const conversationsRef = collection(db, `user/${userId}/ai_conversations`);
    const recentQuery = query(
      conversationsRef,
      where("organizationId", "==", organizationId),
      orderBy("updatedAt", "desc"),
      limit(1)
    );
    
    const recentSnap = await getDocs(recentQuery);
    
    if (!recentSnap.empty) {
      const recentConv = recentSnap.docs[0];
      const data = recentConv.data();
      const updatedAt = data.updatedAt?.toDate();
      const now = new Date();
      const hoursSinceUpdate = (now - updatedAt) / (1000 * 60 * 60);
      
      if (hoursSinceUpdate < 24) {
        return recentConv.id;
      }
    }
    
    const newConversationRef = await addDoc(conversationsRef, {
      organizationId,
      organizationName: organizationName || "Unknown Organization",
      title: "New Conversation",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      messageCount: 0,
      lastMessage: "",
    });
    
    return newConversationRef.id;
  } catch (error) {
    console.error("Error getting/creating conversation:", error);
    throw error;
  }
};

/**
 * Create a new AI conversation
 */
export const createAIConversation = async (userId, organizationId, organizationName) => {
  if (!userId || !organizationId) {
    throw new Error("userId and organizationId are required");
  }

  try {
    const conversationsRef = collection(db, `user/${userId}/ai_conversations`);
    const newConversationRef = await addDoc(conversationsRef, {
      organizationId,
      organizationName: organizationName || "Unknown Organization",
      title: "New Conversation",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      messageCount: 0,
      lastMessage: "",
    });
    
    return newConversationRef.id;
  } catch (error) {
    console.error("Error creating conversation:", error);
    throw error;
  }
};

/**
 * Save a message to a conversation
 */
export const saveMessageToConversation = async (
  userId,
  conversationId,
  message,
  isFirstMessage = false
) => {
  if (!userId || !conversationId || !message?.id) {
    throw new Error("userId, conversationId, and valid message are required");
  }

  try {
    const messagesRef = collection(
      db,
      `user/${userId}/ai_conversations/${conversationId}/messages`
    );
    
    const messageDocRef = doc(messagesRef, message.id);
    
    await setDoc(messageDocRef, {
      text: message.text,
      sender: message.sender,
      timestamp: message.timestamp instanceof Date 
        ? Timestamp.fromDate(message.timestamp) 
        : serverTimestamp(),
      metadata: message.metadata || null,
    });

    const conversationRef = doc(db, `user/${userId}/ai_conversations/${conversationId}`);
    const updateData = {
      updatedAt: serverTimestamp(),
      lastMessage: message.text.substring(0, 100),
    };

    if (isFirstMessage && message.sender === "user") {
      updateData.title = message.text.substring(0, 60) + (message.text.length > 60 ? "..." : "");
    }

    const conversationDoc = await getDoc(conversationRef);
    if (conversationDoc.exists()) {
      updateData.messageCount = (conversationDoc.data().messageCount || 0) + 1;
    }

    await updateDoc(conversationRef, updateData);
  } catch (error) {
    console.error("Error saving message:", error);
    throw error;
  }
};

/**
 * Load a conversation's messages
 */
export const loadConversationMessages = async (userId, conversationId) => {
  if (!userId || !conversationId) {
    return [];
  }

  try {
    const messagesRef = collection(
      db,
      `user/${userId}/ai_conversations/${conversationId}/messages`
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
    console.error("Error loading messages:", error);
    throw error;
  }
};

/**
 * Get all conversations for a user in a specific organization
 */
export const getUserConversations = async (userId, organizationId, limitCount = 50) => {
  if (!userId || !organizationId) {
    return [];
  }

  try {
    const conversationsRef = collection(db, `user/${userId}/ai_conversations`);
    
    const q = query(
      conversationsRef, 
      where("organizationId", "==", organizationId),
      orderBy("updatedAt", "desc"), 
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    }));
  } catch (error) {
    console.error("Error getting conversations:", error);
    
    // Fallback to in-memory filtering if index doesn't exist
    if (error.code === 'failed-precondition') {
      return getConversationsInMemory(userId, organizationId, limitCount);
    }
    
    return [];
  }
};

/**
 * Fallback function for when index isn't ready
 */
const getConversationsInMemory = async (userId, organizationId, limitCount) => {
  try {
    const conversationsRef = collection(db, `user/${userId}/ai_conversations`);
    const q = query(conversationsRef, orderBy("updatedAt", "desc"));
    const snapshot = await getDocs(q);
    
    return snapshot.docs
      .filter(doc => doc.data().organizationId === organizationId)
      .slice(0, limitCount)
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      }));
  } catch (error) {
    console.error("Error in fallback conversation fetch:", error);
    return [];
  }
};

/**
 * Get a single conversation's metadata
 */
export const getConversationMetadata = async (userId, conversationId) => {
  if (!userId || !conversationId) {
    throw new Error("userId and conversationId are required");
  }

  try {
    const conversationRef = doc(db, `user/${userId}/ai_conversations/${conversationId}`);
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
 */
export const deleteConversation = async (userId, conversationId) => {
  if (!userId || !conversationId) {
    throw new Error("userId and conversationId are required");
  }

  try {
    const messagesRef = collection(
      db,
      `user/${userId}/ai_conversations/${conversationId}/messages`
    );
    const messagesSnapshot = await getDocs(messagesRef);
    
    const deletePromises = messagesSnapshot.docs.map((doc) => 
      deleteDoc(doc.ref)
    );
    await Promise.all(deletePromises);

    const conversationRef = doc(db, `user/${userId}/ai_conversations/${conversationId}`);
    await deleteDoc(conversationRef);
  } catch (error) {
    console.error("Error deleting conversation:", error);
    throw error;
  }
};

/**
 * Start a new conversation explicitly
 */
export const startNewConversation = async (userId, organizationId, organizationName) => {
  return await createAIConversation(userId, organizationId, organizationName);
};