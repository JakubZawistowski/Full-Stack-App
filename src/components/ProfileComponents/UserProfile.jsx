import React, { useState, useEffect, createContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import Info from './Info';
import Posts from './Posts';
import Friends from './Friends';
import Images from './Images';
import { logout } from "../../redux/auth";
import {
    sendInvitation,
    cancelInvitation,
    removeFriend,
    fetchFriends,
    fetchInvitations
} from '../../redux/friendsActions'; // Ensure correct actions are imported

export const UserContext = createContext();

const UserProfile = () => {
    const { userId } = useParams(); // Fetching userId from URL
    const [user, setUser] = useState(null); // User data
    const [currentUserId, setCurrentUserId] = useState(null); // Logged-in user id
    const [error, setError] = useState(null); // Error state
    const [view, setView] = useState('Info');
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const friends = useSelector(state => state.friends.friends); // Fetch friends from Redux
    const invitationsSent = useSelector(state => state.friends.invitationsSent); // Fetch sent invitations from Redux

    useEffect(() => {
        const fetchCurrentUserId = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;
            try {
                const response = await axios.get('http://localhost:3002/api/users/me', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setCurrentUserId(response.data._id);
                if (!userId) setUser(response.data);
                dispatch(fetchInvitations(token)); // Pass token to fetchInvitations
            } catch (error) {
                console.error("Error fetching current user:", error);
            }
        };
        fetchCurrentUserId();
    }, [userId, dispatch]);

    useEffect(() => {
        const fetchUserData = async () => {
            if (!userId) return;
            const token = localStorage.getItem('token');
            if (!token) {
                setError('User not found');
                return;
            }
            try {
                const response = await axios.get(`http://localhost:3002/api/users/${userId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (response.data) {
                    setUser(response.data);
                    setView('Info');
                } else {
                    setError('User not found');
                }
            } catch (error) {
                setError('User not found');
            }
        };
        fetchUserData();
    }, [userId]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (userId && token) {
            dispatch(fetchFriends(userId, token)); // Pass userId and token to fetchFriends
            dispatch(fetchInvitations(token)); // Pass token to fetchInvitations
        }
    }, [dispatch, userId]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        dispatch(logout());
        navigate('/login');
    };

    const renderView = () => {
        switch (view) {
            case 'Info':
                return <Info user={user} />;
            case 'Posts':
                return <Posts currentUserId={currentUserId} />;
            case 'Images':
                return <Images userId={userId} />;
            case 'Friends':
                return <Friends userId={userId} />;
            default:
                return <Info user={user} />;
        }
    };

    // Modified send message function
    const handleSendMessage = async () => {
        const token = localStorage.getItem('token');
        try {
            const response = await axios.get('http://localhost:3002/api/chat/chats', {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Znajdź istniejący czat prywatny z użytkownikiem
            const existingChat = response.data.find(chat =>
                chat.participants.length === 2 && // Sprawdzenie, czy czat ma dokładnie 2 uczestników
                chat.participants.some(participant => participant._id === userId)
            );

            if (existingChat) {
                // Przejdź do istniejącego czatu
                navigate(`/chats/${existingChat._id}`, {
                    state: { chatName: `${user.firstName} ${user.lastName}` }
                });
            } else {
                // Jeśli czat nie istnieje, utwórz nowy czat
                const newChat = await axios.post('http://localhost:3002/api/chat/chats', {
                    participants: [userId]
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                // Przejdź do nowego czatu
                navigate(`/chats/${newChat.data._id}`, {
                    state: { chatName: `${user.firstName} ${user.lastName}` }
                });
            }
        } catch (error) {
            console.error('Błąd podczas tworzenia lub pobierania czatu:', error.response.data);
        }
    };



    if (error) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <p className="text-red-500 font-bold text-2xl">{error}</p>
            </div>
        );
    }

    if (!user) {
        return <div>Loading...</div>;
    }

    const fullName = `${user.firstName} ${user.lastName}`;

    const isFriend = (userId) => {
        return friends.some(friend => friend.friends && friend.friends.includes(userId)); // Check in friends array
    };

    const isInvitationSent = (userId) => {
        return invitationsSent.some(invitation => invitation.receiver && invitation.receiver._id === userId && invitation.status === 'pending');
    };

    return (
        <UserContext.Provider value={{ currentUserId }}>
            <div className="flex justify-start flex-col items-center min-h-screen bg-gray-100 mt-0">
                <div className="p-8 rounded shadow-lg max-w-6xl w-full bg-gray-100">
                    <div className="mb-4 flex justify-between items-center">
                        <div className="block font-bold mb-1 text-2xl">{fullName}</div>
                        <div className={"flex w-75"}>
                            <div className = "mr-3">
                        {

                            isFriend(userId) ? (

                                <button
                                    onClick={() => dispatch(removeFriend(userId))}
                                    className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-700 transition duration-200"
                                >
                                    Remove friend
                                </button>
                            ) : isInvitationSent(userId) ? (
                                <button
                                    onClick={() => dispatch(cancelInvitation(userId))}
                                    className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition duration-200"
                                >
                                    Cancel invitation
                                </button>
                            ) : (
                                <button
                                    onClick={() => dispatch(sendInvitation(userId))}
                                    className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-200"
                                >
                                    Send invitation
                                </button>
                            )
                        }
                            </div>
                        {currentUserId && (currentUserId === userId || userId === undefined) ? (
                            <button
                                onClick={handleLogout}
                                className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-700"
                            >
                                Logout
                            </button>
                        ) : (
                            <button
                                onClick={handleSendMessage}
                                className="bg-blue-500 text-white px-4 py-2 rounded-md"
                            >
                                Send message
                            </button>

                        )}
                        </div>
                    </div>
                    <div className="flex flex-row justify-start h-10 w-full mb-4">
                        <button
                            onClick={() => setView('Info')}
                            className="px-4 py-1 rounded-md font-bold text-slate-400 hover:bg-gray-200"
                        >
                            Info
                        </button>
                        <button
                            onClick={() => setView('Posts')}
                            className="px-4 py-1 rounded-md font-bold text-slate-400 hover:bg-gray-200"
                        >
                            Posts
                        </button>
                        <button
                            onClick={() => setView('Images')}
                            className="px-4 py-1 rounded-md font-bold text-slate-400 hover:bg-gray-200"
                        >
                            Images
                        </button>
                        <button
                            onClick={() => setView('Friends')}
                            className="px-4 py-1 rounded-md font-bold text-slate-400 hover:bg-gray-200"
                        >
                            Friends
                        </button>
                    </div>

                    {renderView()}
                </div>
            </div>
        </UserContext.Provider>
    );
};

export default UserProfile;
