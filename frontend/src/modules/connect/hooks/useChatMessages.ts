import { useState, useEffect, useRef } from "react";
import type { SurvivorProfile } from "../types/connect.types";
import type { Message } from "../types/ChatPage.types";
import { getMatches, getMessages, sendMessage, editMessage, deleteMessage } from "../apis/Connect.api";

const POLL_INTERVAL_MS = 4000;

interface UseChatMessagesResult {
  activeContact: SurvivorProfile | null;
  messages: Message[];
  inputText: string;
  setInputText: (text: string) => void;
  editingId: string | null;
  editText: string;
  setEditText: (text: string) => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  handleSend: () => Promise<void>;
  handleDelete: (msgId: string) => Promise<void>;
  handleStartEdit: (msg: Message) => void;
  handleSaveEdit: () => Promise<void>;
  cancelEdit: () => void;
}

/**
 * Manages all chat state and operations for a given survivor conversation.
 * Includes auto-polling every 4 seconds and cleanup on unmount/id change.
 */
export function useChatMessages(id: string | undefined): UseChatMessagesResult {
  const [activeContact, setActiveContact] = useState<SurvivorProfile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load contact profile + message history, then start polling
  useEffect(() => {
    if (!id) {
      const timer = setTimeout(() => {
        setActiveContact(null);
        setMessages([]);
      }, 0);
      return () => clearTimeout(timer);
    }

    async function loadChatData() {
      try {
        const matchesData = await getMatches();
        const found = matchesData.find((m) => m.id === id);
        if (found) setActiveContact(found);

        const messageHistory = await getMessages(id as string);
        setMessages(messageHistory);
      } catch (err) {
        console.error("Failed to sync secure transceiver frequency logs:", err);
      }
    }

    loadChatData();

    const interval = setInterval(() => {
      getMessages(id as string)
        .then(setMessages)
        .catch(() => {});
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [id]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!id || !inputText.trim()) return;
    try {
      const sentMsg = await sendMessage(id, inputText.trim());
      setMessages((prev) => [...prev, sentMsg]);
      setInputText("");
    } catch (err) {
      console.error("Failed to broadcast secure message payload:", err);
    }
  };

  const handleDelete = async (msgId: string) => {
    try {
      await deleteMessage(msgId);
      setMessages((prev) => prev.filter((m) => m.id !== msgId));
    } catch (err) {
      console.error("Failed to purge broadcast packet:", err);
    }
  };

  const handleStartEdit = (msg: Message) => {
    setEditingId(msg.id);
    setEditText(msg.text);
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    try {
      await editMessage(editingId, editText.trim());
      setMessages((prev) =>
        prev.map((m) => (m.id === editingId ? { ...m, text: editText.trim() } : m))
      );
      setEditingId(null);
      setEditText("");
    } catch (err) {
      console.error("Failed to update broadcast payload:", err);
    }
  };

  const cancelEdit = () => setEditingId(null);

  return {
    activeContact,
    messages,
    inputText,
    setInputText,
    editingId,
    editText,
    setEditText,
    messagesEndRef,
    handleSend,
    handleDelete,
    handleStartEdit,
    handleSaveEdit,
    cancelEdit,
  };
}
