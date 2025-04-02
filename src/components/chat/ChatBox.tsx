import React from 'react';
import { motion } from 'framer-motion';
import { Send, ImageIcon, Star, Shield, Loader2 } from 'lucide-react';
import useSound from 'use-sound';
import { useMembership } from '../../hooks/useMembership';
import { useChat } from '../../hooks/useChat';
import type { ChatParticipant, ChatMessage } from '../../types/chat';

interface ChatBoxProps {
  participant: ChatParticipant;
}

export function ChatBox({ participant }: ChatBoxProps) {
  const [message, setMessage] = React.useState('');
  const { messages, sendMessage, isTyping, setTypingStatus } = useChat();
  const [playSend] = useSound('/sounds/tap.mp3', { volume: 0.5 });
  const { currentPlan } = useMembership();
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const typingTimeoutRef = React.useRef<NodeJS.Timeout>();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (message.trim()) {
      sendMessage(message.trim());
      setMessage('');
      playSend();
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    // Set typing status
    setTypingStatus(true);
    
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout to clear typing status
    typingTimeoutRef.current = setTimeout(() => {
      setTypingStatus(false);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex-1 overflow-y-auto ios-scroll p-4 space-y-4">
        <div className="flex items-center space-x-3 p-4 modern-card rounded-2xl mb-6">
          <img
            src={participant.avatar}
            alt={participant.name}
            className="w-12 h-12 rounded-full object-cover"
          />
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <span className="text-white font-light">{participant.name}</span>
              {participant.badges?.influencerTier && (
                <div className="px-2 py-0.5 bg-white/10 rounded-full flex items-center space-x-1">
                  <Star className="w-3 h-3 text-white" />
                  <span className="text-xs text-white capitalize">
                    {participant.badges.influencerTier}
                  </span>
                </div>
              )}
              {participant.verified && (
                <Shield className="w-4 h-4 text-white" />
              )}
            </div>
            <span className="text-xs text-white/60 capitalize">{participant.role}</span>
          </div>
        </div>
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.sender === participant.role ? 'justify-start' : 'justify-end'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.sender === participant.role
                  ? 'modern-card text-white mr-12'
                  : 'bg-white text-black ml-12'
              }`}
            >
              <p className="text-sm font-light">{msg.text}</p>
              <span className="text-xs opacity-60 mt-1 block">
                {new Date(msg.timestamp).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            </div>
          </motion.div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-white/10">
        <div className="flex items-end space-x-4">
          <div className="flex-1 modern-card rounded-2xl">
            <textarea
              value={message}
              onChange={handleTyping}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="w-full bg-transparent text-white placeholder-white/40 p-4 outline-none resize-none text-sm font-light"
              rows={1}
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
          </div>
          {isTyping && (
            <div className="absolute -top-6 left-4 text-xs text-white/40">
              <div className="flex items-center space-x-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>{participant.name} is typing...</span>
              </div>
            </div>
          )}
          <div className="flex space-x-2">
            <button className="p-3 modern-card rounded-xl ios-button">
              <ImageIcon className="w-5 h-5 text-white/80" />
            </button>
            <button 
              onClick={handleSend}
              className={`p-3 rounded-xl ios-button ${
                currentPlan?.tier === 'free' 
                  ? 'modern-card text-white/80'
                  : 'bg-white'
              }`}
            >
              <Send className={`w-5 h-5 ${
                currentPlan?.tier === 'free'
                  ? 'text-white/80'
                  : 'text-black'
              }`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}