import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion'; // For animations
import io from 'socket.io-client';
import axios from 'axios'; // For making HTTP requests
import {
  FaSearch,
  FaPaperPlane,
  FaSmile,
  FaCircle,
  FaEllipsisV,
  FaEdit,
  FaTrashAlt,
} from 'react-icons/fa';
import { APP_API_BASE_URL, buildApiUrl, getAuthHeaders } from '../config/api';
import { useAuth } from '../context/AuthContext';

const socket = io(APP_API_BASE_URL, { withCredentials: true });

const ChatApp = () => {
  const { userData } = useAuth();
  const senderName = userData?.fullName || userData?.username || 'You';
  const [message, setMessage] = useState('');
  const [profiles, setProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [typing, setTyping] = useState(false);
  const [chatHistory, setChatHistory] = useState([]); // Local chat history

  useEffect(() => {
    const loadProfiles = async () => {
      try {
        const response = await fetch(buildApiUrl('/admin/getalluser'), {
          headers: {
            ...getAuthHeaders(),
          },
          credentials: 'include',
        });
        const data = await response.json();
        const users = Array.isArray(data?.data) ? data.data : data;
        const mapped = (users || []).map((user) => ({
          name: user.fullName || user.username,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || user.username)}&background=0f172a&color=22d3ee&bold=true`,
          status: 'Online',
          chatHistory: [],
        }));
        setProfiles(mapped);
        setSelectedProfile((prev) => prev || mapped[0] || null);
      } catch (error) {
        console.error('Error fetching chat contacts:', error);
      }
    };

    loadProfiles();
  }, []);

  useEffect(() => {
    if (!selectedProfile) return;
    // Load chat history from backend when a profile is selected
    const fetchChatHistory = async () => {
      try {
        const response = await axios.get(buildApiUrl(`/api/chat/history/${selectedProfile.name}`));
        // Ensure the data is an array
        const history = Array.isArray(response.data) ? response.data : [];
        setChatHistory(history); // Set the fetched chat history
      } catch (error) {
        console.error('Error fetching chat history:', error);
        setChatHistory([]); // Set chatHistory as an empty array in case of an error
      }
    };
  
    fetchChatHistory();
  
    // Listen for incoming messages via Socket.io
    socket.on('message', (message) => {
      if (message.receiver === selectedProfile.name) {
        setChatHistory((prev) => [...prev, message]);
      }
    });
  
    // Typing indicator
    socket.on('typing', (data) => {
      if (data.sender === selectedProfile.name) {
        setTyping(data.typing);
      }
    });
  
    // Cleanup socket listeners when component unmounts or profile changes
    return () => {
      socket.off('message');
      socket.off('typing');
    };
  }, [selectedProfile]);
  

  const sendMessage = async (e) => {
    e.preventDefault();
    if (message.trim() && selectedProfile) {
      const newMessage = {
        sender: senderName,
        text: message,
        receiver: selectedProfile.name,
      };

      // Emit the message to the server via Socket.io
      socket.emit('chatMessage', newMessage);

      // Store the message in the backend (MongoDB)
      try {
        await axios.post(buildApiUrl('/api/chat/send'), newMessage);
        setChatHistory((prev) => [...prev, newMessage]); // Update local chat history
        setMessage('');
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  };

  const handleTyping = (e) => {
    setMessage(e.target.value);
    socket.emit('typing', { sender: senderName, receiver: selectedProfile.name, typing: e.target.value.length > 0 });
  };

  return (
    <div className="page flex min-h-[70vh] overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur">
      {/* Sidebar */}
      <aside className="w-1/4 bg-white/5 p-5 shadow-2xl backdrop-blur">
        <h2 className="text-2xl font-bold mb-5 border-b border-white/10 pb-2">Contacts</h2>
        <ul className="space-y-3">
          {profiles.map((profile, index) => (
            <li
              key={index}
              className={`p-3 rounded-2xl cursor-pointer transition-transform hover:scale-[1.02] ${
                selectedProfile.name === profile.name
                  ? 'bg-white/10 shadow-lg'
                  : 'hover:bg-white/5'
              }`}
              onClick={() => {
                setSelectedProfile(profile);
                setChatHistory(profile.chatHistory); // Load the selected profile's chat history
              }}
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
                    <FaCircle
                      className={`ml-2 text-${profile.status === 'Online' ? 'green' : 'gray'}-500`}
                      size={10}
                    />
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </aside>

      {/* Chat Section */}
      <section className="flex-1 flex flex-col bg-white/5 shadow-2xl backdrop-blur">
        {/* Chat Header */}
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

        {/* Chat Messages */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-transparent">
          <ul>
            {chatHistory.map((msg, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className={`max-w-[75%] p-3 rounded-lg ${
                  msg.sender === 'You'
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

        {/* Message Input */}
        <form
          onSubmit={sendMessage}
          className="flex items-center p-4 border-t border-white/10 bg-white/5"
        >
          <div className="relative w-full">
            <input
              type="text"
              value={message}
              onChange={handleTyping}
                disabled={!selectedProfile}
                className="peer w-full rounded-lg border border-white/10 bg-slate-900/70 p-3 text-slate-200 focus:outline-none focus:ring focus:ring-cyan-400 disabled:opacity-60"
              id="message"
              placeholder="Type a message"
              required
            />
            <label
              htmlFor="message"
              className="absolute left-3 top-2 text-sm text-slate-400 transition-all duration-200 ease-in-out peer-focus:text-cyan-400"
            >
             disabled={!selectedProfile}
              Type a message
            </label>
          </div>

          <button
            type="submit"
            className="ml-3 rounded-lg bg-cyan-400 p-3 text-slate-900 transition-transform hover:scale-105 hover:bg-cyan-300"
          >
            <FaPaperPlane className="text-white" />
          </button>
        </form>
      </section>
    </div>
  );
};

export default ChatApp;
