import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserFriends } from '@fortawesome/free-solid-svg-icons';

const CreateGroupChat = () => {
    const [chattedUsers, setChattedUsers] = useState([]); // Lista użytkowników, z którymi czatowałeś
    const [searchResults, setSearchResults] = useState([]); // Wyniki wyszukiwania użytkowników
    const [searchQuery, setSearchQuery] = useState(''); // Pole wyszukiwania
    const [selectedUsers, setSelectedUsers] = useState([]); // Wybrani użytkownicy do grupy
    const [groupName, setGroupName] = useState(''); // Nazwa grupy
    const [currentUser, setCurrentUser] = useState(null); // Zalogowany użytkownik
    const [friends, setFriends] = useState([]); // Lista znajomych
    const [loading, setLoading] = useState(false); // Status ładowania
    const navigate = useNavigate(); // Hook do nawigacji

    // Pobieranie danych zalogowanego użytkownika
    useEffect(() => {
        const fetchCurrentUser = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('http://localhost:3002/api/users/me', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setCurrentUser(response.data); // Ustawienie danych zalogowanego użytkownika
            } catch (error) {
                console.error('Error fetching current user:', error);
            }
        };

        fetchCurrentUser();
    }, []);

    // Pobieranie znajomych
    useEffect(() => {
        const fetchFriends = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('http://localhost:3002/api/friends/my-friends', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setFriends(response.data); // Ustawienie listy znajomych
            } catch (error) {
                console.error('Error fetching friends:', error);
            }
        };

        fetchFriends();
    }, [currentUser]);

    // Pobieranie użytkowników, z którymi czatowałeś
    // Pobieranie użytkowników, z którymi czatowałeś prywatnie
    useEffect(() => {
        if (!currentUser) return; // Poczekaj na pobranie danych zalogowanego użytkownika

        const fetchChattedUsers = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('http://localhost:3002/api/chat/chats', {
                    headers: { Authorization: `Bearer ${token}` },
                });

                // Wyciągnij unikalnych użytkowników z czatów prywatnych, wykluczając zalogowanego użytkownika
                const uniqueUsers = response.data
                    .filter(chat => !chat.isGroupChat) // Uwzględnij tylko czaty, które nie są grupowe
                    .map(chat => chat.participants)
                    .flat()
                    .filter(user => user._id !== currentUser._id);

                // Usuwanie duplikatów na podstawie user._id
                const uniqueUsersSet = Array.from(new Set(uniqueUsers.map(user => user._id)))
                    .map(id => uniqueUsers.find(user => user._id === id));

                setChattedUsers(uniqueUsersSet);
            } catch (error) {
                console.error('Error fetching chatted users:', error);
            }
        };

        fetchChattedUsers();
    }, [currentUser]);


    // Wyszukiwanie użytkowników na podstawie wpisanego tekstu
    const handleSearch = async (e) => {
        setSearchQuery(e.target.value);
        if (e.target.value === '') {
            setSearchResults([]); // Jeśli pole jest puste, resetujemy wyniki wyszukiwania
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`http://localhost:3002/api/users/search?query=${e.target.value}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            // Wyklucz zalogowanego użytkownika oraz zaznaczonych użytkowników z wyników wyszukiwania
            const filteredResults = response.data
                .filter(user => user._id !== currentUser._id && !selectedUsers.some(selectedUser => selectedUser._id === user._id));

            setSearchResults(filteredResults);
        } catch (error) {
            console.error('Error searching users:', error);
        } finally {
            setLoading(false);
        }
    };

    // Zaznaczanie/odznaczanie użytkownika
    const handleUserSelect = (user) => {
        // Jeśli użytkownik już jest zaznaczony, usuń go z listy
        if (selectedUsers.some(selectedUser => selectedUser._id === user._id)) {
            setSelectedUsers(selectedUsers.filter(u => u._id !== user._id));
        } else {
            // Dodaj użytkownika tylko jeśli nie jest już zaznaczony
            setSelectedUsers([...selectedUsers, user]);
        }
    };

    // Funkcja do tworzenia grupowego czatu
    const handleCreateGroupChat = async () => {
        if (selectedUsers.length < 1) {
            alert("Please select at least one user to create a group chat.");
            return;
        }

        if (groupName.trim() === '') {
            alert("Please provide a name for the group chat.");
            return;
        }

        try {
            const token = localStorage.getItem('token');
            console.log('Creating group chat with:', {
                groupName,
                participants: [...selectedUsers.map(user => user._id), currentUser._id],
                moderators: [currentUser._id] // Debugging line
            });
            const response = await axios.post('http://localhost:3002/api/chat/create-group', {
                groupName,
                participants: [...selectedUsers.map(user => user._id), currentUser._id],
                moderators: [currentUser._id]
            }, {
                headers: { Authorization: `Bearer ${token}` },
            });

            console.log('Group chat created:', response.data); // Log response
            navigate(`/chats/${response.data._id}`,{
                state: { chatName: groupName }
            });
        } catch (error) {
            console.error('Error creating group chat:', error);
        }
    };



    // Renderowanie listy: Jeśli coś jest wpisane, pokaż wyniki wyszukiwania, w przeciwnym razie pokaż użytkowników, z którymi czatowałeś
    const usersToDisplay = searchQuery ? searchResults : chattedUsers;

    return (
        <div className="max-w-md mx-auto mt-8 p-6 bg-white shadow-md rounded-lg" style={{ height: '500px' }}>
            <h1 className="text-2xl font-semibold mb-4 text-center">Create Group Chat</h1>

            {/* Pole do wpisania nazwy grupy */}
            <input
                type="text"
                placeholder="Group Name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            />

            {/* Pole wyszukiwania */}
            <input
                type="text"
                placeholder="Search for users..."
                value={searchQuery}
                onChange={handleSearch}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            />

            {/* Jeśli trwa wyszukiwanie, pokaż komunikat */}
            {loading ? (
                <div className="text-center text-gray-500">Loading...</div>
            ) : (
                <div className="max-h-60 overflow-y-auto"> {/* Ustaw stałą wysokość i przewijanie */}
                    <ul className="space-y-2">
                        {/* Jeśli nie ma wyników wyszukiwania, pokaż komunikat */}
                        {usersToDisplay.length === 0 ? (
                            <li className="text-center text-gray-500">No users found</li>
                        ) : (
                            usersToDisplay.map(user => (
                                <li
                                    key={user._id}
                                    onClick={() => handleUserSelect(user)}
                                    className={`px-4 py-2 rounded-md shadow-sm cursor-pointer transition-colors ${
                                        selectedUsers.some(selectedUser => selectedUser._id === user._id) ? 'bg-blue-200' : 'bg-gray-100 hover:bg-gray-200'
                                    }`}
                                >
                                    <span className="flex items-center">
                                        {friends.some(friend => friend._id === user._id) && (
                                            <FontAwesomeIcon icon={faUserFriends} className="text-green-500 mr-2" />
                                        )}
                                        {user.firstName} {user.lastName}
                                    </span>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            )}

            {/* Wybrani użytkownicy */}
            {selectedUsers.length > 0 && (
                <div className="mt-6">
                    <h2 className="text-lg font-semibold mb-2">Selected Users:</h2>
                    <ul className="space-y-2">
                        {selectedUsers.map(user => (
                            <li key={user._id} className="px-4 py-2 bg-blue-100 rounded-md shadow-sm">
                                {user.firstName} {user.lastName}
                                <button
                                    onClick={() => handleUserSelect(user)} // Odznaczanie użytkownika
                                    className="ml-4 text-red-500 hover:text-red-700 transition duration-200"
                                >
                                    Remove
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Przycisk do zatwierdzania */}
            <button
                onClick={handleCreateGroupChat}
                className="mt-4 w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-700 transition duration-200"
            >
                Create Group Chat
            </button>
        </div>
    );
};

export default CreateGroupChat;
