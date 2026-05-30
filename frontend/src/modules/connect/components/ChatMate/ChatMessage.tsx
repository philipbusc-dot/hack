import { useParams } from "react-router-dom";
import type { ChatMessageProps } from "../../types/ChatPage.types";
import { Send, Menu } from "lucide-react";
import { useChatMessages } from "../../hooks/useChatMessages";
import MessageBubble from "./MessageBubble";

const ChatMessage = ({ isSidebarOpen, onToggleSidebar }: ChatMessageProps) => {
    const { id } = useParams<{ id: string }>();
    const {
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
    } = useChatMessages(id);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") handleSend();
    };

    const handleEditKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") handleSaveEdit();
        if (e.key === "Escape") cancelEdit();
    };



    // Placeholder when no contact is selected
    if (!id || !activeContact) {
        return (
            <div className="flex-1 flex flex-col h-full bg-neutral-900 min-w-0">
                <div className="px-4 pt-8 pb-4 border-b border-neutral-700 inline-flex items-center gap-3 select-none bg-neutral-900 shrink-0">
                    {!isSidebarOpen && (
                        <button
                            onClick={onToggleSidebar}
                            className="p-1.5 rounded hover:bg-neutral-800 text-indigo-50 border border-neutral-700 shrink-0"
                            title="Open Contacts"
                        >
                            <Menu size={18} />
                        </button>
                    )}
                    <span className="text-indigo-50 text-2xl font-medium font-['Inter']">Secure Chats</span>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none font-mono">
                    <span className="text-4xl mb-4 animate-pulse">📡</span>
                    <h3 className="font-bold text-indigo-50 text-lg uppercase mb-2">Transceiver Standby</h3>
                    <p className="text-xs text-neutral-400 max-w-xs mt-1 leading-relaxed">
                        Select an online profile from your matches, or open the contacts panel.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col flex-1 h-full bg-neutral-900 min-w-0 overflow-hidden font-['Inter']">

            {/* Header */}
            <div className="self-stretch px-6 pt-8 pb-4 border-b border-neutral-700 bg-neutral-900 inline-flex justify-start items-center gap-3 shrink-0 select-none min-w-0">
                {!isSidebarOpen && (
                    <button
                        onClick={onToggleSidebar}
                        className="p-1.5 rounded hover:bg-neutral-800 text-indigo-50 border border-neutral-700 shrink-0"
                        title="Open Contacts"
                    >
                        <Menu size={18} />
                    </button>
                )}
                <div className="flex-1 flex items-center justify-between min-w-0">
                    <div className="text-indigo-50 text-xl md:text-2xl font-medium truncate">
                        {activeContact.name}
                    </div>
                    <span className="px-2 py-0.5 text-xs rounded border border-purple-500/30 text-purple-400 font-mono shrink-0 select-none bg-purple-950/20">
                        {activeContact.matchType === "love" ? "💜 Super Connection" : "Approved"}
                    </span>
                </div>
            </div>

            {/* Messages scroll area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 min-w-0 bg-neutral-950 scrollbar-thin">
                <div className="self-stretch text-center py-2 text-white text-xs md:text-sm font-medium font-['Inter'] select-none">
                    "{activeContact.name}" wants to talk to you
                </div>

                {messages.map((msg) => (
                    <MessageBubble
                        key={msg.id}
                        msg={msg}
                        activeContact={activeContact}
                        editingId={editingId}
                        editText={editText}
                        onSetEditText={setEditText}
                        onStartEdit={handleStartEdit}
                        onSaveEdit={handleSaveEdit}
                        onCancelEdit={cancelEdit}
                        onDelete={handleDelete}
                        onEditKeyDown={handleEditKeyDown}
                    />
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input footer */}
            <div className="self-stretch px-4 py-3 bg-neutral-800 border-t border-neutral-700 inline-flex justify-center items-center gap-3 shrink-0">
                <div className="flex-1 h-11 px-4 bg-neutral-900 border border-neutral-700 rounded-[999px] flex justify-center items-center gap-2">
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="type here"
                        className="flex-1 bg-transparent text-indigo-50 placeholder-neutral-500 text-sm md:text-base font-medium outline-none"
                    />
                </div>
                <button
                    onClick={handleSend}
                    className="size-11 px-2.5 bg-neutral-900 border border-neutral-700 hover:border-lime-400 rounded-full flex justify-center items-center transition-all active:scale-95 text-indigo-50 hover:text-lime-400 shadow-md shrink-0"
                    title="Send broadcast"
                >
                    <Send size={18} />
                </button>
            </div>
        </div>
    );
};

export default ChatMessage;