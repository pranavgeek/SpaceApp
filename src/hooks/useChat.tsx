import React from 'react';
import type { Chat, ChatMessage, ChatParticipant } from '../types/chat';

interface ChatState {
  activeChat: Chat | null;
  messages: ChatMessage[];
  isTyping: boolean;
  unreadCount: number;
}

interface ChatContextType extends ChatState {
  sendMessage: (text: string) => Promise<void>;
  markAsRead: (chatId: string) => void;
  setTypingStatus: (isTyping: boolean) => void;
}

const ChatContext = React.createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<ChatState>({
    activeChat: null,
    messages: [],
    isTyping: false,
    unreadCount: 0
  });

  const sendMessage = async (text: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      text,
      sender: 'buyer',
      timestamp: new Date(),
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, newMessage]
    }));

    // Simulate response after delay
    setTimeout(() => {
      const response: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: "Thanks for your message! I'll get back to you soon.",
        sender: 'seller',
        timestamp: new Date(),
      };
      setState(prev => ({
        ...prev,
        messages: [...prev.messages, response]
      }));
    }, 1000);
  };

  const markAsRead = (chatId: string) => {
    setState(prev => ({
      ...prev,
      unreadCount: 0
    }));
  };

  const setTypingStatus = (isTyping: boolean) => {
    setState(prev => ({
      ...prev,
      isTyping
    }));
  };

  const value = React.useMemo(() => ({
    ...state,
    sendMessage,
    markAsRead,
    setTypingStatus
  }), [state]);

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = React.useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}