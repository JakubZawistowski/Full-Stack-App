import React, { useState, useEffect, useRef } from 'react';
import {useLocation, useNavigate, useParams} from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import io from 'socket.io-client';
import ChatList from './ChatList';
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faUserFriends} from "@fortawesome/free-solid-svg-icons";
import Modal from "../Modal/Modal";
const Chat = () => {
    const { user: currentUser } = useSelector((state) => state.auth);
    const { chatId } = useParams();
    const location = useLocation();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [chatName, setChatName] = useState(location.state?.chatName || 'Chat');
    const [newModerator, setNewModerator] = useState('');
    const [newGroupName, setNewGroupName] = useState('');
    const [participants, setParticipants] = useState([]);
    const [moderators, setModerators] = useState([]);
    const [availableParticipants, setAvailableParticipants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const socket = useRef(null);
    const messagesEndRef = useRef(null);
    const [showOptions, setShowOptions] = useState(false);
    const [selectedOption, setSelectedOption] = useState(null);
    const [showUsersList, setShowUsersList] = useState(false); // Nowy stan do zarządzania widocznością listy użytkowników
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [participantToRemove, setParticipantToRemove] = useState(null);
    const [confirmLeave, setConfirmLeave] = useState(false);
    const [searchResults, setSearchResults] = useState([]); // Wyniki wyszukiwania
    const [searchQuery, setSearchQuery] = useState(''); // Zapytanie wyszukiwania
    const [chattedUsers, setChattedUsers] = useState([]); // Użytkownicy, z którymi czatowałeś
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [audioChunks, setAudioChunks] = useState([]);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [audioUrl, setAudioUrl] = useState('');
    const audioRef = useRef(null); // Ref do elementu audio
    const navigate = useNavigate();
    // Ładowanie szczegółów czatu
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            loadAvailableParticipants(token);
        }
    }, [moderators]);


    const loadChatDetails = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`http://localhost:3002/api/chat/chats/${chatId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setMessages(response.data.messages);
            setParticipants(response.data.participants); // Załadowanie identyfikatorów uczestników
            setModerators(response.data.moderators);

            // Ustawienie nazwy czatu
            setChatName(location.state?.chatName);
            // Sprawdź, czy mamy pełne dane uczestników na serwerze
            const fullParticipantsData = await Promise.all(
                response.data.participants.map(async (participantId) => {
                    const participantResponse = await axios.get(`http://localhost:3002/api/users/${participantId}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    return participantResponse.data; // Zwróć pełne dane uczestnika
                })
            );

            // Ustawienie dostępnych uczestników
            const availableParticipants = fullParticipantsData.filter(
                (participant) => !response.data.moderators.includes(participant._id)
            );
            setParticipants(fullParticipantsData)
            setAvailableParticipants(availableParticipants);
        } catch (error) {
            setError('Błąd podczas pobierania szczegółów czatu');
            console.error('Błąd podczas pobierania szczegółów czatu:', error);
        } finally {
            setLoading(false);
        }
    };

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

    const loadAvailableParticipants = async (token) => {
        try {
            // Pobieramy uczestników grupy
            const response = await axios.get(`http://localhost:3002/api/chat/chats/${chatId}/participants`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            // Filtrujemy uczestników, którzy nie są moderatorami
            const availableParticipants = response.data.filter(
                (participant) => !moderators.includes(participant._id)
            );

            setAvailableParticipants(availableParticipants);
        } catch (error) {
            console.error('Błąd podczas pobierania dostępnych uczestników:', error);
        }
    };

    const loadParticipants = async (token) => {
        try {
            const response = await axios.get(`http://localhost:3002/api/chat/chats/${chatId}/participants`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setParticipants(response.data); // Ustawianie uczestników
        } catch (error) {
            console.error('Błąd podczas pobierania uczestników:', error);
        }
    };
    // Zarządzanie połączeniem socket
    useEffect(() => {
        socket.current = io('http://localhost:3002', {
            query: { userId: currentUser.id },
            transports: ['websocket', 'polling'],
            withCredentials: true,
        });

        const handleMessage = (message) => {
            if (message.sender._id !== currentUser.id) {
                setMessages((prevMessages) => [...prevMessages, message]);
            }
        };

        socket.current.on('message', handleMessage);

        return () => {
            socket.current.off('message', handleMessage);
            if (socket.current.connected) {
                socket.current.disconnect();
            }
        };
    }, [currentUser.id]);

    useEffect(() => {
        loadChatDetails();
        resetOptions();
    }, [chatId]);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const handleSendMessage = async () => {
        if (newMessage.trim() === '' && !selectedFile) return;

        const formData = new FormData();

        if (newMessage.trim()) {
            formData.append('content', newMessage);
        }

        if (selectedFile) {
            formData.append('image', selectedFile);
            console.log('File URL:', URL.createObjectURL(selectedFile)); // Loguj adres URL pliku
        }

        formData.append('sender', JSON.stringify({
            _id: currentUser.id,
            firstName: currentUser.firstName,
            lastName: currentUser.lastName,
        }));
        formData.append('receiver', chatId);

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(`http://localhost:3002/api/chat/chats/${chatId}/message`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const savedMessage = response.data;
            socket.current.emit('message', savedMessage);
            setMessages((prevMessages) => [...prevMessages, savedMessage]);
            setNewMessage('');
            setSelectedFile(null);
        } catch (error) {
            console.error('Błąd podczas wysyłania wiadomości:', error);
        }
    };



    const handleKeyPress = (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            handleSendMessage();
        }
    };

    const handleAddModerator = async (userId) => {
        const token = localStorage.getItem('token');
        try {
            await axios.put(`http://localhost:3002/api/chat/chats/${chatId}/moderator/${userId}`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });

            // Po dodaniu moderatora ponownie załaduj szczegóły czatu
            await loadChatDetails();
            resetOptions(); // Resetowanie opcji po dodaniu
        } catch (error) {
            console.error('Błąd podczas dodawania moderatora:', error);
            alert('Błąd podczas dodawania moderatora.');
        }
    };


    const handleChangeGroupName = async (newGroupName) => {
        const token = localStorage.getItem('token');
        try {
            await axios.put(
                `http://localhost:3002/api/chat/chats/${chatId}/groupName`,
                { newName: newGroupName },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            setChatName(newGroupName);
            resetOptions(); // Resetowanie opcji po zmianie nazwy grupy
        } catch (error) {
            console.error('Błąd podczas zmiany nazwy grupy:', error);
            alert('Błąd podczas zmiany nazwy grupy.');
        }
    };

    const handleRemoveParticipant = async (userId) => {
        setParticipantToRemove(userId);
        setConfirmDelete(true);
    };

    const confirmRemoveParticipant = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:3002/api/chat/chats/${chatId}/participants/${participantToRemove}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            // Natychmiastowe aktualizacje stanu lokalnego
            setParticipants((prevParticipants) =>
                prevParticipants.filter(participant => participant._id !== participantToRemove)
            );
            setModerators((prevModerators) =>
                prevModerators.filter(moderator => moderator._id !== participantToRemove)
            );

            alert('Użytkownik został usunięty z grupy.');
            setConfirmDelete(false);
            setParticipantToRemove(null);
        } catch (error) {
            console.error('Błąd podczas usuwania uczestnika z grupy:', error);
            alert('Błąd podczas usuwania uczestnika.');
        }
    };


    const confirmLeaveGroup = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:3002/api/chat/chats/${chatId}/participants/${currentUser.id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            alert('Opuszczono czat.');
            setConfirmLeave(false);
            navigate('/chats');
        } catch (error) {
            console.error('Błąd podczas opuszczania czatu:', error);
            alert('Błąd podczas opuszczania czatu.');
        }

    };


    const resetOptions = () => {
        setShowOptions(false);
        setSelectedOption('');
        setNewModerator('');
        setNewGroupName('');
    };
    const isUserModerator = () => {
        return moderators.some(mod =>mod === currentUser.id);
    };
    const handleConfirmLeaveGroup = () => {
        setConfirmLeave(true);
    };

    const handleRemoveModerator = async (userId) => {
        const token = localStorage.getItem('token');
        try {
            await axios.delete(`http://localhost:3002/api/chat/chats/${chatId}/moderators/${userId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            // Zaktualizuj lokalny stan moderatorów
            setModerators(moderators.filter(moderator => moderator !== userId));
            // Możesz też zaktualizować uczestników, jeśli potrzebne
            alert('Moderator został usunięty');
        } catch (error) {
            console.error('Błąd podczas usuwania moderatora:', error);
            alert('Wystąpił błąd podczas usuwania moderatora');
        }
    };

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

            // Wyklucz zalogowanego użytkownika oraz uczestników czatu z wyników wyszukiwania
            const filteredResults = response.data
                .filter(user => user._id !== currentUser._id && !participants.some(participant => participant._id === user._id));

            setSearchResults(filteredResults);
        } catch (error) {
            console.error('Error searching users:', error);
        } finally {
            setLoading(false);
        }
    };

    // Funkcja do dodawania nowego użytkownika do czatu
    const handleAddUser = async (userId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`http://localhost:3002/api/chat/${chatId}/add-user`, { userId }, {
                headers: { Authorization: `Bearer ${token}` },
            });

            // Po dodaniu użytkownika zaktualizuj uczestników
            setParticipants(prev => [...prev, { _id: userId }]);
            setSearchResults(prev => prev.filter(user => user._id !== userId)); // Usunięcie dodanego użytkownika z wyników wyszukiwania
        } catch (error) {
            console.error('Error adding user to chat:', error);
        }
    };

    const handleDeleteChat = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.delete(`http://localhost:3002/api/chat/${chatId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            alert(response.data.message);
            navigate('/chats')
        } catch (error) {
            console.error('Error deleting chat:', error);
            alert('Error deleting chat. Please try again.');
        } finally {
            setLoading(false);
            setModalIsOpen(false); // Zamknij modal po usunięciu czatu
        }
    };


    // Renderowanie listy: Jeśli coś jest wpisane, pokaż wyniki wyszukiwania, w przeciwnym razie pokaż użytkowników, z którymi czatowałeś
    const usersToDisplay = searchQuery ? searchResults : chattedUsers.filter(
        user => user._id !== currentUser._id && !participants.some(participant => participant._id === user._id)
    );
    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            const resizedFile = await resizeImage(file);
            setSelectedFile(resizedFile);
        }
    };

    const resizeImage = (file) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = URL.createObjectURL(file);

            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800; // Maksymalna szerokość
                const MAX_HEIGHT = 600; // Maksymalna wysokość
                let width = img.width;
                let height = img.height;

                // Zmiana rozmiaru obrazu
                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Zapisz zmniejszony obraz jako plik
                canvas.toBlob((blob) => {
                    resolve(new File([blob], file.name, { type: file.type }));
                }, file.type, 0.7); // Można zmieniać jakość (0.7 to 70%)
            };
        });
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            let chunks = []; // Tymczasowy bufor na kawałki audio

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunks.push(event.data);
                }
            };

            recorder.onstop = async () => {
                // Poczekaj na zakończenie wszystkich zdarzeń ondataavailable
                if (chunks.length > 0) {
                    const audioBlob = new Blob(chunks, { type: 'audio/webm' });

                    // Tworzenie FormData do wysłania pliku audio
                    const formData = new FormData();
                    formData.append('audio', audioBlob, 'voice_message.webm');

                    try {
                        const token = localStorage.getItem('token');
                        const response = await axios.post(`http://localhost:3002/api/chat/chats/${chatId}/message`, formData, {
                            headers: {
                                Authorization: `Bearer ${token}`,
                                'Content-Type': 'multipart/form-data',
                            },
                        });

                        const savedMessage = response.data; // Otrzymana wiadomość
                        setMessages((prevMessages) => [...prevMessages, savedMessage]);
                    } catch (error) {
                        console.error('Błąd podczas wysyłania wiadomości:', error);
                    } finally {
                        chunks = []; // Wyczyść bufor po zakończeniu nagrywania
                    }
                } else {
                    console.log('Brak danych do nagrania');
                }
            };

            recorder.start();
            setMediaRecorder(recorder);
            setIsRecording(true);
        } catch (error) {
            console.error('Błąd podczas rozpoczęcia nagrywania:', error);
        }
    };

    const stopRecording = () => {
        if (mediaRecorder) {
            mediaRecorder.stop(); // Wywołanie stop spowoduje wyzwolenie zdarzenia onstop
            setIsRecording(false);
        }
    };

// Funkcje obsługi zdarzeń przycisku
    const handleMouseDown = () => {
        startRecording();
    };

    const handleMouseUp = () => {
        stopRecording();
    };


    return (
        <div className="chat-page flex">
            <div className="chat-container flex-1">
                <div className="chat-header p-2 bg-gray-100 border-b border-gray-100 flex justify-between items-center ml-2 mt-2">
                    <h2 className="text-lg font-semibold">{chatName}</h2>
                    <button
                        onClick={() => setShowOptions((prev) => !prev)}
                        className="text-2xl"
                    >
                        <span>⋮</span>
                    </button>
                </div>
                {loading ? (
                    <div className="text-center">Loading messages...</div>
                ) : error ? (
                    <div className="text-red-500 text-center">{error}</div>
                ) : (
                    <div className="messages-container max-h-96 overflow-y-auto p-2">
                        {messages.map((message, index) => (
                            <div key={index} className="message-container my-2">
                                <div key={message._id}
                                     className={`message ${message.sender._id === currentUser.id ? 'bg-blue-500 text-white self-end' : 'bg-gray-300 text-black self-start'} rounded-lg p-2 max-w-xs`}>
                                    {message.content && <p>{message.content}</p>}
                                    {message.isImage && message.imageUrl && (
                                        <img
                                            src={`http://localhost:3002/${message.imageUrl.replace(/\\/g, '/')}`} // Zastąp backslash ukośnikiem
                                            alt="message"
                                            style={{
                                                maxWidth: '100%',
                                                maxHeight: '300px'
                                            }} // Ustawienia stylu dla obrazów
                                        />
                                    )}
                                    {message.audioUrl && ( // Dodany warunek dla wiadomości głosowej
                                        <audio controls className="mt-2">
                                            <source src={`http://localhost:3002/${message.audioUrl}`} type="audio/webm" />
                                            Your browser does not support the audio element.
                                        </audio>
                                    )}
                                </div>
                                {(index === messages.length - 1 || messages[index + 1].sender._id !== message.sender._id) && (
                                    <p className="text-xs text-gray-500 mt-1">{`${message.sender.firstName} ${message.sender.lastName}`}</p>
                                )}
                            </div>
                        ))}
                        <div ref={messagesEndRef}/>
                    </div>
                )}
                <div className="input-container p-2">
                <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey ? handleSendMessage() : null}
                    placeholder="Send message..."
                    rows="3"
                    className="w-full resize-none border rounded p-2"
                />
                    <div className="flex items-center mt-2">
                        <button
                            onMouseDown={handleMouseDown}
                            onMouseUp={handleMouseUp}
                            className={`px-4 py-2 rounded ${isRecording ? 'bg-red-500' : 'bg-green-500'} text-white mr-2 hover:bg-green-700`}
                        >
                            {isRecording ? 'Recording...' : 'Hold to record'}
                        </button>

                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="mr-2"
                        />
                        <button
                            onClick={handleSendMessage}
                            className="bg-blue-500 text-white p-2 rounded w-20 hover:bg-blue-700"
                        >
                            Send
                        </button>
                    </div>
                </div>
            </div>
            <div className="chat-options-container w-60 ml-5 p-2 border-l border-gray-300">
                {showOptions && (
                    <div>
                        {isUserModerator() && (
                            <div>
                                <h3 className="text-lg font-semibold">Chat options</h3>
                                <button
                                    onClick={() => setSelectedOption('addModerator')}
                                    className="w-full text-left p-2 hover:bg-gray-100"
                                >
                                    Dodaj moderatora
                                </button>
                                <button
                                    onClick={() => setSelectedOption('changeGroupName')}
                                    className="w-full text-left p-2 hover:bg-gray-100"
                                >
                                    Change group name
                                </button>
                                <button
                                    onClick={() => setSelectedOption('removeModerator')}
                                    className="w-full text-left p-2 hover:bg-gray-100"
                                >
                                    Delete moderator
                                </button>
                                <button
                                    onClick={() => setSelectedOption('addUser')}
                                    className="w-full text-left p-2 hover:bg-gray-100"
                                >
                                    Add users
                                </button>
                                <button
                                    onClick={() => setSelectedOption('deleteChat')}
                                    className="w-full text-left p-2 hover:bg-gray-100"
                                >
                                    Delete chat
                                </button>
                            </div>
                        )}
                        <button
                            onClick={() => {
                                setSelectedOption('showParticipants');
                                setShowUsersList((prev) => !prev);
                            }}
                            className="w-full text-left p-2 hover:bg-gray-100"
                        >
                            Show participants
                        </button>

                        <button
                            onClick={handleConfirmLeaveGroup}
                            className="w-full text-left p-2 hover:bg-gray-100"
                        >
                            Leave chat
                        </button>
                    </div>
                )}

                {showOptions && (
                    <div className="mt-2 p-2 border rounded bg-gray-100">
                        {selectedOption === 'addModerator' && (
                            <div>
                                <h4 className="text-lg">Add moderator</h4>
                                <select
                                    value={newModerator}
                                    onChange={(e) => setNewModerator(e.target.value)}
                                    className="border rounded p-1 w-full"
                                >
                                    <option value="">Select user...</option>
                                    {availableParticipants.map((user) => (
                                        <option key={user._id} value={user._id}>
                                            {user.firstName} {user.lastName}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    onClick={() => {
                                        if (newModerator) {
                                            handleAddModerator(newModerator);
                                            resetOptions();
                                        }
                                    }}
                                    className="mt-2 bg-blue-500 text-white p-1 rounded"
                                >
                                    Dodaj
                                </button>
                                <button
                                    onClick={resetOptions}
                                    className="mt-2 ml-2 border p-1 rounded"
                                >
                                    Anuluj
                                </button>
                            </div>
                        )}
                        {selectedOption === 'changeGroupName' && (
                            <div>
                                <h4 className="text-lg">Change group name</h4>
                                <input
                                    type="text"
                                    placeholder="New group name"
                                    value={newGroupName}
                                    onChange={(e) => setNewGroupName(e.target.value)}
                                    className="border rounded p-1 w-full"
                                />
                                <button
                                    onClick={() => {
                                        handleChangeGroupName(newGroupName);
                                        resetOptions();
                                    }}
                                    className="mt-2 bg-blue-500 text-white p-1 rounded"
                                >
                                    Zmień
                                </button>
                                <button
                                    onClick={resetOptions}
                                    className="mt-2 ml-2 border p-1 rounded"
                                >
                                    Anuluj
                                </button>
                            </div>
                        )}
                        {selectedOption === 'showParticipants' && (
                            <div className="mt-2">
                                <h4 className="text-lg">Chat's participants</h4>
                                <ul>
                                    {participants.map((participant) => (
                                        <li
                                            key={participant._id}
                                            className="flex justify-between items-center p-1"
                                        >
                                            {participant.firstName} {participant.lastName}
                                            {moderators.some((mod) => mod === participant._id) && (
                                                <span className="text-sm text-gray-500">(Moderator)</span>
                                            )}
                                            {isUserModerator() && (
                                                <button
                                                    onClick={() => handleRemoveParticipant(participant._id)}
                                                    className="ml-2 text-red-500"
                                                >
                                                    Usuń
                                                </button>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {selectedOption === 'removeModerator' && (
                            <div className="mt-2">
                                <h4 className="text-lg">Remove moderator</h4>
                                {participants
                                    .filter(participant => moderators.includes(participant._id)) // Filtrowanie tylko moderatorów
                                    .map((participant) => (
                                        <li
                                            key={participant._id}
                                            className="flex justify-between items-center p-1"
                                        >
                                            {participant.firstName} {participant.lastName}
                                            {isUserModerator() && (
                                                <>
                                                    <button
                                                        onClick={() => handleRemoveModerator(participant._id)}
                                                        className="ml-2 text-red-500"
                                                    >
                                                        Usuń moderatora
                                                    </button>
                                                </>
                                            )}
                                        </li>
                                    ))}
                            </div>
                        )}
                        {selectedOption === 'addUser' && (
                            <div className="max-w-md mx-auto mt-8 p-6 bg-white shadow-md rounded-lg"
                                 style={{height: '500px'}}>
                                <h1 className="text-2xl font-semibold mb-4 text-center">Chat Participants</h1>

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
                                    <div
                                        className="max-h-60 overflow-y-auto"> {/* Ustaw stałą wysokość i przewijanie */}
                                        <ul className="space-y-2">
                                            {/* Jeśli nie ma wyników wyszukiwania, pokaż komunikat */}
                                            {usersToDisplay.length === 0 ? (
                                                <li className="text-center text-gray-500">No users found</li>
                                            ) : (
                                                usersToDisplay.map(user => (
                                                    <li
                                                        key={user._id}
                                                        className="px-4 py-2 rounded-md shadow-sm cursor-pointer transition-colors bg-gray-100 hover:bg-gray-200 flex justify-between"
                                                    >
                                    <span className="flex items-center">
                                        {user.firstName} {user.lastName}
                                        <FontAwesomeIcon icon={faUserFriends} className="text-green-500 ml-2"/>
                                    </span>
                                                        <button
                                                            onClick={() => handleAddUser(user._id)}
                                                            className="ml-2 text-blue-500 hover:text-blue-700"
                                                        >
                                                            Add
                                                        </button>
                                                    </li>
                                                ))
                                            )}
                                        </ul>
                                    </div>
                                )}

                                {/* Uczestnicy czatu */}
                                <div className="mt-6">
                                    <h2 className="text-lg font-semibold mb-2">Participants:</h2>
                                    <ul className="space-y-2">
                                        {participants.map(participant => (
                                            <li key={participant._id}
                                                className="px-4 py-2 bg-blue-100 rounded-md shadow-sm">
                                                {participant.firstName} {participant.lastName}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}
                        {selectedOption === 'deleteChat' && (

                            <div>
                                {/* Przycisk do otwierania modalu */}
                                <button
                                    onClick={() => setModalIsOpen(true)}
                                    className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
                                >
                                    Delete Chat
                                </button>

                                {/* Modal potwierdzenia usunięcia czatu */}
                                <Modal
                                    isOpen={modalIsOpen}
                                    onRequestClose={() => setModalIsOpen(false)}
                                    contentLabel="Confirm Delete"
                                    className="modal"
                                    overlayClassName="overlay"
                                >
                                    <h2 className="text-lg font-semibold">Are you sure you want to delete this chat?</h2>
                                    <div className="flex justify-end mt-4">
                                        <button
                                            onClick={handleDeleteChat}
                                            className={`px-4 py-2 ${loading ? 'bg-gray-500' : 'bg-red-500'} text-white rounded-md`}
                                            disabled={loading} // Zablokuj przycisk podczas ładowania
                                        >
                                            {loading ? 'Deleting...' : 'Delete'}
                                        </button>
                                    </div>
                                </Modal>
                            </div>

                        )}

                    </div>
                )}
            </div>
            <div className="chat-list-container w-60 ml-5">
                <ChatList/>
            </div>

            {confirmDelete && (
                <div className="modal fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="modal-content bg-white p-4 rounded shadow-lg">
                        <h4 className="text-lg font-semibold">Confirm deleting</h4>
                        <p>Are you sure, you want to remove this group participant?</p>
                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={() => setConfirmDelete(false)}
                                className="mr-2 border p-1 rounded"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmRemoveParticipant}
                                className="bg-red-500 text-white p-1 rounded"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {confirmLeave && (
                <div className="modal fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="modal-content bg-white p-4 rounded shadow-lg">
                        <h4 className="text-lg font-semibold">Confirm leaving</h4>
                        <p>Czy na pewno chcesz opuścić ten czat?</p>
                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={() => setConfirmLeave(false)}
                                className="mr-2 border p-1 rounded"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmLeaveGroup}
                                className="bg-red-500 text-white p-1 rounded"
                            >
                                Leave
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

};

export default Chat;
