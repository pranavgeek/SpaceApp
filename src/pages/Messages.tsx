import React from 'react';
import { ChatList } from '../components/chat/ChatList';

export function Messages() {
  return (
    <div className="min-h-screen bg-black">
      <div className="pt-[calc(env(safe-area-inset-top)+4rem)]">
        <ChatList />
      </div>
    </div>
  );
}