import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FaPaperPlane, FaCircle } from 'react-icons/fa';
import { fetchChatContacts, fetchChatHistory, sendChatMessage } from '../services/sangamApi';
import { createAuthenticatedSocket } from '../utils/socketClient';
import { useAuth } from '../context/AuthContext';

const ChatApp = () => {
  const { userData } = useAuth();
  const senderName = userData?.fullName || userData?.username || 'You';
  const socketRef = useRef(null);
  const [message, setMessage] = useState('');
  const [profiles, setProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [typing, setTyping] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);

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
        const users = await fetchChatContacts();
        const mapped = (users || [])
          .filter((user) => (user.fullName || user.username) !== senderName)
          .map((user) => ({
            name: user.fullName || user.username,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || user.username)}&background=0f172a&color=22d3ee&bold=true`,
            status: 'Online',
          }));
        setProfiles(mapped);
        setSelectedProfile((prev) => prev || mapped[0] || null);
      } catch (error) {
        console.error('Error fetching chat contacts:', error);
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
      } catch (error) {
        console.error('Error fetching chat history:', error);
        setChatHistory([]);
      }
    };

    loadHistory();

    const onMessage = (incoming) => {
      const involvesContact =
        incoming.sender === selectedProfile.name ||
        incoming.receiver === selectedProfile.name;
      const involvesSelf =
        incoming.sender === senderName || incoming.receiver === senderName;

      if (involvesContact && involvesSelf) {
        setChatHistory((prev) => [...prev, incoming]);
      }
    };

    const onTyping = (data) => {
      if (data.sender === selectedProfile.name) {
        setTyping(data.typing);
      }
    };

    socket.on('message', onMessage);
    socket.on('typing', onTyping);

    return () => {
      socket.off('message', onMessage);
      socket.off('typing', onTyping);
    };
  }, [selectedProfile, senderName]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !selectedProfile || !socketRef.current) return;

    const payload = {
      receiver: selectedProfile.name,
      text: message.trim(),
    };

    socketRef.current.emit('chatMessage', payload);

    try {
      await sendChatMessage(payload);
      setChatHistory((prev) => [
        ...prev,
        { sender: senderName, receiver: selectedProfile.name, text: payload.text },
      ]);
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleTyping = (e) => {
    const value = e.target.value;
    setMessage(value);
    if (selectedProfile && socketRef.current) {
      socketRef.current.emit('typing', {
        receiver: selectedProfile.name,
        typing: value.length > 0,
      });
    }
  };

  return (
    <div className="page flex min-h-[70vh] overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur">
      <aside className="w-1/4 bg-white/5 p-5 shadow-2xl backdrop-blur">
        <h2 className="text-2xl font-bold mb-5 border-b border-white/10 pb-2">Contacts</h2>
        <ul className="space-y-3">
          {profiles.map((profile) => (
            <li
              key={profile.name}
              className={`p-3 rounded-2xl cursor-pointer transition-transform hover:scale-[1.02] ${
                selectedProfile?.name === profile.name
                  ? 'bg-white/10 shadow-lg'
                  : 'hover:bg-white/5'
              }`}
              onClick={() => setSelectedProfile(profile)}
            >
              <div className="flex items-center">
                <img
                  src={profile.avatar}
                  alt={profile.name}
                  className="w-12 h-12 rounded-full mr-3"
                />
                <div>
                  <p className="font-semibold">{profile.name}</p>
                  <div className="flex items-center">
                    <p className="text-sm text-gray-400">{profile.status}</p>
                    <FaCircle className="ml-2 text-green-500" size={10} />
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </aside>

      <section className="flex-1 flex flex-col bg-white/5 shadow-2xl backdrop-blur">
        <header className="flex items-center p-4 border-b border-white/10 bg-white/5">
          <img
            src={selectedProfile?.avatar}
            alt={selectedProfile?.name}
            className="w-12 h-12 rounded-full mr-3"
          />
          <div>
            <h2 className="text-lg font-semibold">{selectedProfile?.name || 'Select a contact'}</h2>
            <p className="text-sm text-gray-400">{typing ? 'Typing...' : selectedProfile?.status}</p>
          </div>
        </header>

        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-transparent">
          <ul>
            {chatHistory.map((msg, index) => (
              <motion.li
                key={msg._id || `${msg.sender}-${index}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className={`max-w-[75%] p-3 rounded-lg ${
                  msg.sender === senderName
                    ? 'bg-cyan-500/90 ml-auto text-slate-900'
                    : 'bg-white/10 text-slate-200'
                }`}
              >
                <p className="text-sm font-semibold mb-1">{msg.sender}</p>
                <p>{msg.text}</p>
              </motion.li>
            ))}
          </ul>
        </div>

        <form
          onSubmit={sendMessage}
          className="flex items-center p-4 border-t border-white/10 bg-white/5"
        >
          <input
            type="text"
            value={message}
            onChange={handleTyping}
            disabled={!selectedProfile}
            className="w-full rounded-lg border border-white/10 bg-slate-900/70 p-3 text-slate-200 focus:outline-none focus:ring focus:ring-cyan-400 disabled:opacity-60"
            placeholder="Type a message"
            required
          />

          <button
            type="submit"
            disabled={!selectedProfile}
            className="ml-3 rounded-lg bg-cyan-400 p-3 text-slate-900 transition-transform hover:scale-105 hover:bg-cyan-300 disabled:opacity-50"
          >
            <FaPaperPlane className="text-white" />
          </button>
        </form>
      </section>
    </div>
  );
};

export default ChatApp;
