import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

function App() {
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [chats, setChats] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    socket.on('newMessage', msg => {
      setChats(prevChats => [...prevChats, msg]);
    });

    socket.on('userJoined', username => {
      setNewMessage(${username} has joined the chat.);
    });

    socket.on('userLeft', username => {
      setNewMessage(${username} has left the chat.);
    });

    return () => {
      socket.off('newMessage');
      socket.off('userJoined');
      socket.off('userLeft');
    };
  }, []);

  const handleJoin = () => {
    if (username) {
      socket.emit('join', username);
    }
  };

  const handleSendMessage = () => {
    if (message) {
      socket.emit('sendMessage', message);
      setMessage('');
    }
  };

  return (
    <div>
      {!username ? (
        <div>
          <input
            type="text"
            placeholder="Enter your name"
            value={username}
            onChange={e => setUsername(e.target.value)}
          />
          <button onClick={handleJoin}>Join Chat</button>
        </div>
      ) : (
        <div>
          <div>
            {chats.map((chat, index) => (
              <div key={index}>
                <strong>{chat.username}:</strong> {chat.message}
              </div>
            ))}
            {newMessage && <div>{newMessage}</div>}
          </div>
          <input
            type="text"
            placeholder="Type a message"
            value={message}
            onChange={e => setMessage(e.target.value)}
          />
          <button onClick={handleSendMessage}>Send</button>
        </div>
      )}
    </div>
  );
}

export default App;