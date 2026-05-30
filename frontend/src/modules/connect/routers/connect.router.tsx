import ChatPage from "../pages/ChatPage";
import MatchmakingPage from "../pages/MatchMakingPage";

export const connectRoutes = [
  {
    path: "connect",
    element: <MatchmakingPage />
  },
  {
    path: "chat",
    element: <ChatPage />
  },
  {
    path: "chat/:id",
    element: <ChatPage />
  }
];
