import { useState } from "react";
import ChatListSidebar from "../components/ChatMate/ChatListSidebar";
import ChatMessage from "../components/ChatMate/ChatMessage";

const ChatPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex flex-row w-screen h-screen bg-neutral-950 overflow-hidden relative min-h-0 min-w-0">
      
      {/* Backdrop for closing sidebar when clicking outside (visible on mobile overlay) */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="md:hidden fixed inset-0 bg-black/20 z-10"
        />
      )}

      <ChatListSidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
      
      <ChatMessage 
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
      />
    </div>
  );
};

export default ChatPage;