import api from "../../../api";
import type { SurvivorProfile, SwipeResponse } from "../types/connect.types";
import type { Message, EditMessageResponse, DeleteMessageResponse } from "../types/ChatPage.types";

// 1. Get current user's profile info
export async function getCurrentUser(): Promise<SurvivorProfile> {
  const res = await api.get<SurvivorProfile>("/connect/user/me");
  return res.data;
}

// 2. Retrieve nearby survivors with dynamic Haversine distance & AI compatibility
export async function getSurvivors(): Promise<SurvivorProfile[]> {
  const res = await api.get<SurvivorProfile[]>("/connect/survivors");
  return res.data;
}

// 3. Update Current GPS Location
export async function updateLocation(latitude: number, longitude: number): Promise<SurvivorProfile> {
  const res = await api.patch<SurvivorProfile>("/connect/location", { latitude, longitude });
  return res.data;
}

// 4. Swipe Survivor Like/Love/No
export async function swipeSurvivor(
  receiverId: string,
  status: "like" | "love" | "no"
): Promise<SwipeResponse> {
  const res = await api.post<SwipeResponse>("/connect/swipe", { receiverId, status });
  return res.data;
}

// 5. List Matched Survivor Profiles
export async function getMatches(): Promise<SurvivorProfile[]> {
  const res = await api.get<SurvivorProfile[]>("/connect/matches");
  return res.data;
}

// 6. Retrieve secure chat message history between you and survivor
export async function getMessages(survivorId: string): Promise<Message[]> {
  const res = await api.get<Message[]>(`/connect/messages/${survivorId}`);
  return res.data;
}

// 7. Send Chat Message & Trigger Secure Companion Automated Reply
export async function sendMessage(survivorId: string, text: string): Promise<Message> {
  const res = await api.post<Message>(`/connect/messages/${survivorId}`, { text });
  return res.data;
}

// 8. Edit Secure Message Content
export async function editMessage(messageId: string, text: string): Promise<EditMessageResponse> {
  const res = await api.patch<EditMessageResponse>(`/connect/messages/${messageId}`, { text });
  return res.data;
}

// 9. Delete Message
export async function deleteMessage(messageId: string): Promise<DeleteMessageResponse> {
  const res = await api.delete<DeleteMessageResponse>(`/connect/messages/${messageId}`);
  return res.data;
}
