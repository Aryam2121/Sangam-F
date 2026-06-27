import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { FaPaperPlane } from "react-icons/fa";
import { fetchChatContacts, fetchChatHistory, sendChatMessage } from "../services/sangamApi";
import { createAuthenticatedSocket } from "../utils/socketClient";
import { useAuth } from "../context/AuthContext";
import PageHeader from "./ui/PageHeader";
import { EmptyState, inputClass } from "./ui/FeatureUi";

const ChatApp = () => {
  const { userData } = useAuth();
  const senderName = userData?.fullName || userData?.username || "User";
  const socketRef = useRef(null);
  const [message, setMessage] = useState("");
  const [profiles, setProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [typing, setTyping] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(true);

  useEffect(() => {
    const socket = createAuthenticatedSocket();
    socketRef.current = socket;
    return () => {
      socket?.disconnect();
      socketRef.current = null;
    };
  }, []);

  useEffect(() => {
    const loadProfiles = async () => {
      try {
        setLoadingContacts(true);
        const users = await fetchChatContacts();
        const mapped = (users || [])
          .filter((user) => (user.fullName || user.username) !== senderName)
          .map((user) => ({
            name: user.fullName || user.username,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || user.username)}&background=0f172a&color=22d3ee&bold=true`,
            status: user.isOnline ? "Online" : "Available",
          }));
        setProfiles(mapped);
        setSelectedProfile((prev) => prev || mapped[0] || null);
      } catch {
        toast.error("Could not load contacts");
      } finally {
        setLoadingContacts(false);
      }
    };
    loadProfiles();
  }, [senderName]);

  useEffect(() => {
    if (!selectedProfile || !socketRef.current) return undefined;
    const socket = socketRef.current;

    const loadHistory = async () => {
      try {
        const history = await fetchChatHistory(selectedProfile.name);
        setChatHistory(Array.isArray(history) ? history : []);
      } catch {
        toast.error("Could not load chat history");
        setChatHistory([]);
      }
    };

    loadHistory();

    const onMessage = (incoming) => {
      const involvesContact =
        incoming.sender === selectedProfile.name || incoming.receiver === selectedProfile.name;
      const involvesSelf = incoming.sender === senderName || incoming.receiver === senderName;
      if (involvesContact && involvesSelf) {
        setChatHistory((prev) => [...prev, incoming]);
      }
    };

    const onTyping = (data) => {
      if (data.sender === selectedProfile.name) setTyping(data.typing);
    };

    socket.on("message", onMessage);
    socket.on("typing", onTyping);
    return () => {
      socket.off("message", onMessage);
      socket.off("typing", onTyping);
    };
  }, [selectedProfile, senderName]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !selectedProfile || !socketRef.current) return;

    const payload = { receiver: selectedProfile.name, text: message.trim() };
    socketRef.current.emit("chatMessage", payload);

    try {
      await sendChatMessage(payload);
      setChatHistory((prev) => [...prev, { sender: senderName, receiver: selectedProfile.name, text: payload.text }]);
      setMessage("");
    } catch {
      toast.error("Failed to send message");
    }
  };

  const handleTyping = (e) => {
    const value = e.target.value;
    setMessage(value);
    if (selectedProfile && socketRef.current) {
      socketRef.current.emit("typing", { receiver: selectedProfile.name, typing: value.length > 0 });
    }
  };

  return (
    <div className="page-stack pb-10">
      <PageHeader kicker="Messages" title="Direct chat" subtitle="Real-time messaging with your team" />

      <div className="flex min-h-[70vh] overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur">
        <aside className="hidden w-72 shrink-0 border-r border-white/10 bg-white/5 p-5 md:block">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">Contacts</h2>
          {loadingContacts ? (
            <p className="text-sm text-slate-500">Loading…</p>
          ) : profiles.length === 0 ? (
            <EmptyState title="No contacts" description="Other users will appear here." />
          ) : (
            <ul className="space-y-2">
              {profiles.map((profile) => (
                <li key={profile.name}>
                  <button
                    type="button"
                    onClick={() => setSelectedProfile(profile)}
                    className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left transition ${
                      selectedProfile?.name === profile.name ? "bg-white/10" : "hover:bg-white/5"
                    }`}
                  >
                    <img src={profile.avatar} alt="" className="h-10 w-10 rounded-full" />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-white">{profile.name}</p>
                      <p className="text-xs text-slate-500">{profile.status}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center gap-3 border-b border-white/10 p-4">
            {selectedProfile ? (
              <>
                <img src={selectedProfile.avatar} alt="" className="h-10 w-10 rounded-full" />
                <div>
                  <h2 className="font-semibold text-white">{selectedProfile.name}</h2>
                  <p className="text-xs text-slate-400">{typing ? "Typing…" : selectedProfile.status}</p>
                </div>
              </>
            ) : (
              <p className="text-slate-400">Select a contact to start chatting</p>
            )}
          </header>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {!selectedProfile ? (
              <EmptyState title="No conversation" description="Pick a contact from the sidebar." />
            ) : chatHistory.length === 0 ? (
              <EmptyState title="No messages yet" description="Send the first message below." />
            ) : (
              <ul className="space-y-3">
                {chatHistory.map((msg, index) => (
                  <motion.li
                    key={msg._id || `${msg.sender}-${index}`}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      msg.sender === senderName
                        ? "ml-auto bg-cyan-400/90 text-slate-900"
                        : "bg-white/10 text-slate-200"
                    }`}
                  >
                    <p className="text-xs font-semibold opacity-70">{msg.sender}</p>
                    <p className="mt-1">{msg.text}</p>
                  </motion.li>
                ))}
              </ul>
            )}
          </div>

          <form onSubmit={sendMessage} className="flex gap-2 border-t border-white/10 p-4">
            <input
              type="text"
              value={message}
              onChange={handleTyping}
              disabled={!selectedProfile}
              className={inputClass}
              placeholder="Type a message…"
            />
            <button type="submit" disabled={!selectedProfile} className="btn btn-primary shrink-0 px-4">
              <FaPaperPlane />
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default ChatApp;
