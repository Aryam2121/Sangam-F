import React, { useState, useEffect, useCallback } from 'react';
import io from 'socket.io-client';
import { AiOutlineSend } from 'react-icons/ai';
import { FaSmile } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { APP_API_BASE_URL, buildApiUrl } from '../config/api';
import { fetchDiscussionHistory } from '../services/sangamApi';
import { useAuth } from '../context/AuthContext';
import PageHeader from './ui/PageHeader';

const socket = io(APP_API_BASE_URL, { withCredentials: true });

const fallbackDepartments = [
  { name: "Water", icon: "💧" },
  { name: "Gas", icon: "⛽" },
  { name: "Road Construction", icon: "🛣️" },
];

const iconByName = (name) => {
  const key = name?.toLowerCase() || "";
  if (key.includes("water")) return "💧";
  if (key.includes("road")) return "🛣️";
  if (key.includes("electric")) return "⚡";
  if (key.includes("gas")) return "⛽";
  return "🏢";
};

const shapeMessage = (msg) => ({
  id: msg.id || msg._id?.toString() || `${Date.now()}-${Math.random()}`,
  user: msg.user,
  department: msg.department,
  content: msg.content,
  time: msg.time || (msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString() : ""),
  isFavorite: Boolean(msg.isFavorite),
});

const Discuss = () => {
  const { userData } = useAuth();
  const displayName = userData?.fullName || userData?.username || "User";

  const [departments, setDepartments] = useState(fallbackDepartments);
  const [selectedDepartment, setSelectedDepartment] = useState(fallbackDepartments[0].name);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const loadHistory = useCallback(async (department) => {
    setLoadingHistory(true);
    try {
      const history = await fetchDiscussionHistory(department);
      setMessages(history.map(shapeMessage));
    } catch {
      toast.error("Could not load discussion history");
      setMessages([]);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const response = await fetch(buildApiUrl('/api/getalldep'));
        const data = await response.json();
        const mapped = (Array.isArray(data) ? data : []).map((dept) => ({
          name: dept.name,
          icon: iconByName(dept.name),
        }));
        if (mapped.length) {
          setDepartments(mapped);
          setSelectedDepartment(mapped[0].name);
        }
      } catch (error) {
        console.error('Failed to load departments', error);
      }
    };

    loadDepartments();
  }, []);

  useEffect(() => {
    if (!selectedDepartment) return;

    loadHistory(selectedDepartment);
    socket.emit('joinDepartment', selectedDepartment);

    const onHistory = (history) => {
      if (Array.isArray(history) && history.length) {
        setMessages(history.map(shapeMessage));
      }
    };
    const onNew = (message) => {
      setMessages((prev) => [...prev, shapeMessage(message)]);
    };
    const onTyping = (status) => setIsTyping(status);

    socket.on('messageHistory', onHistory);
    socket.on('newMessage', onNew);
    socket.on('typing', onTyping);

    return () => {
      socket.off('messageHistory', onHistory);
      socket.off('newMessage', onNew);
      socket.off('typing', onTyping);
    };
  }, [selectedDepartment, loadHistory]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    const message = {
      id: Date.now(),
      user: displayName,
      department: selectedDepartment,
      content: newMessage.trim(),
      time: new Date().toLocaleTimeString(),
      isFavorite: false,
    };
    socket.emit('sendMessage', message);
    setNewMessage("");
  };

  return (
    <div className="page pb-10">
      <PageHeader
        kicker="Collaboration"
        title="Department discussion"
        subtitle="Real-time threads per department — messages are saved to the server."
      />

      <div className="flex min-h-[70vh] w-full min-w-0 overflow-hidden rounded-3xl border border-white/10 bg-white/5 text-gray-200 shadow-2xl backdrop-blur">
        <aside className="hidden w-64 shrink-0 border-r border-white/10 bg-white/5 p-5 md:block lg:w-72">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">Departments</h2>
          <ul className="space-y-2">
            {departments.map((dept) => (
              <li key={dept.name}>
                <button
                  type="button"
                  onClick={() => setSelectedDepartment(dept.name)}
                  className={`flex w-full items-center rounded-2xl p-3 text-left transition ${
                    selectedDepartment === dept.name
                      ? 'bg-cyan-400/15 text-white'
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <span className="mr-3 text-lg">{dept.icon}</span>
                  <span className="truncate text-sm">{dept.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col p-4 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h1 className="text-xl font-bold text-white sm:text-2xl">{selectedDepartment}</h1>
            <select
              className="md:hidden w-full max-w-xs"
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
            >
              {departments.map((d) => (
                <option key={d.name} value={d.name}>{d.name}</option>
              ))}
            </select>
          </div>

          {isTyping && (
            <p className="mb-2 text-sm italic text-slate-400">Someone is typing...</p>
          )}

          <div className="custom-scrollbar flex-1 space-y-3 overflow-y-auto rounded-2xl border border-white/10 bg-slate-950/60 p-4">
            {loadingHistory && messages.length === 0 ? (
              <div className="flex justify-center py-12">
                <div className="loading-spinner" />
              </div>
            ) : messages.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">
                No messages yet. Start the conversation.
              </p>
            ) : (
              messages.map((msg) => {
                const isMine = msg.user === displayName;
                return (
                  <div
                    key={msg.id}
                    className={`max-w-[85%] rounded-2xl p-4 shadow-md ${
                      isMine
                        ? 'ml-auto bg-cyan-500/90 text-slate-900'
                        : 'bg-white/10 text-gray-200'
                    }`}
                  >
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <p className="font-semibold">{msg.user}</p>
                      <span className="text-xs opacity-70">{msg.time}</span>
                    </div>
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button type="button" className="text-slate-400 hover:text-slate-200" aria-label="Emoji">
              <FaSmile size={22} />
            </button>
            <input
              type="text"
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              className="min-w-0 flex-1"
            />
            <button
              type="button"
              onClick={handleSendMessage}
              className="btn btn-primary shrink-0 px-4"
            >
              <AiOutlineSend size={20} />
            </button>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Discuss;
