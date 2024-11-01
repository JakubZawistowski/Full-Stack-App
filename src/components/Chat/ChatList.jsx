import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom'; // Używamy Link do nawigacji
import axios from 'axios';

const ChatList = () => {
    const [chats, setChats] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);

    // Pobieranie informacji o zalogowanym użytkowniku
    useEffect(() => {
        const fetchCurrentUser = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('http://localhost:3002/api/users/me', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setCurrentUser(response.data);
            } catch (error) {
                console.error('Error fetching current user:', error);
            }
        };

        fetchCurrentUser();
    }, []);

    // Pobieranie wszystkich czatów użytkownika
    useEffect(() => {
        const fetchChats = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('http://localhost:3002/api/chat/chats', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setChats(response.data);
            } catch (error) {
                console.error('Error fetching chats:', error);
            }
        };

        fetchChats();
    }, []);

    if (!currentUser) {
        return <div>Loading...</div>; // Wyświetla coś, dopóki dane o bieżącym użytkowniku się nie załadują
    }

    return (
        <div className="chat-list ml-3 mt-3">

            {/* Przycisk do tworzenia grupowego czatu */}
            <div className="mb-4">
                <Link to="/create-group-chat">
                    <button
                        className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-700 transition duration-200">
                        Create group chat
                    </button>
                </Link>
            </div>
            <h1 className="text-green-500 text-xl font-bold">Your chats:</h1>
            <ul>
                {chats.map(chat => {
                    // Jeśli czat jest grupowy, wyświetlamy nazwę grupy
                    if (chat.isGroupChat) {
                        return (
                            <li key={chat._id}>
                                <Link to={`/chats/${chat._id}`} state={{chatName: chat.groupName}}>
                                    {chat.groupName} (Users: {chat.participants.length})
                                </Link>
                            </li>
                        );
                    }

                    // W przypadku czatu prywatnego wyświetlamy nazwisko innego użytkownika
                    const otherUser = chat.participants.find(user => user._id !== currentUser._id);

                    return (
                        <li key={chat._id}>
                            <Link to={`/chats/${chat._id}`}
                                  state={{chatName: otherUser ? `${otherUser.firstName} ${otherUser.lastName}` : 'No participant'}}>
                                {otherUser ? `${otherUser.firstName} ${otherUser.lastName}` : 'No participant'}
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};

export default ChatList;
