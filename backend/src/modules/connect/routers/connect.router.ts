import { Router } from "express";
import {
  getCurrentUser,
  getNearbySurvivors,
  getSurvivorOpinion,
  updateLocation,
  swipeSurvivor,
  getMatches,
  getMessages,
  sendMessage,
  editMessage,
  deleteMessage
} from "../controllers/connect.controller";
import { requireAuth } from "../../../middlewares/auth";

const connectRouter = Router();

// Matchmaking + chat are per-user features: require a logged-in user.
connectRouter.use(requireAuth);

// Survivor Profile Actions
connectRouter.get("/user/me", getCurrentUser);
connectRouter.get("/survivors", getNearbySurvivors);
connectRouter.get("/survivors/:id/opinion", getSurvivorOpinion);
connectRouter.patch("/location", updateLocation);

// Matchmaking Swipe Actions
connectRouter.post("/swipe", swipeSurvivor);
connectRouter.get("/matches", getMatches);

// Secure Chats Broadcaster Actions
connectRouter.get("/messages/:id", getMessages);
connectRouter.post("/messages/:id", sendMessage);
connectRouter.patch("/messages/:messageId", editMessage);
connectRouter.delete("/messages/:messageId", deleteMessage);

export default connectRouter;
