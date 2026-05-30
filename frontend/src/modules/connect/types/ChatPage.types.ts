// ─── Component Props ──────────────────────────────────────────────────────────

export interface ChatMessageProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

// ─── Message ──────────────────────────────────────────────────────────────────

export interface Message {
  id: string;
  sender: "you" | "them";
  text: string;
  timestamp: string;
}

// ─── Request Payloads ─────────────────────────────────────────────────────────

export interface SendMessageRequest {
  text: string;
}

// ─── Response Shapes ─────────────────────────────────────────────────────────

export interface EditMessageResponse {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: string;
  createdAt: string;
}

export interface DeleteMessageResponse {
  success: boolean;
  message: string;
}
