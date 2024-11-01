import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchInvitations, removeFriend, sendInvitation, cancelInvitation, fetchFriends } from '../redux/friendsActions'; // Import akcji Redux

const SearchResults = ({ errorMsg }) => {
    const location = useLocation();
    const { users, errorMessage } = location.state || { users: [], errorMessage: '' };
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const friends = useSelector((state) => state.friends.friends);
    const invitationsSent = useSelector((state) => state.friends.invitationsSent); // Pobranie zaproszeń z Redux

    useEffect(() => {
        if (user) {
            const token = localStorage.getItem('token');
            console.log('Current User ID:', user.id); // Debugging
            dispatch(fetchFriends(user.id,token)); // Pobierz znajomych dla user.id
        }
    }, [dispatch, user]);

    useEffect(() => {
        if (user) {
            const token = localStorage.getItem('token');
            dispatch(fetchInvitations(token)); // Wywołanie akcji Redux do pobrania zaproszeń
        }
    }, [dispatch, user]);

    // Filtrowanie użytkowników, aby usunąć obecnego użytkownika
    const filteredUsers = users.filter(u => user && u._id !== user.id);

    // Sprawdzenie, czy użytkownik jest przyjacielem
    const isFriend = (userId) => {
        return friends.some(friend => friend._id === userId); // Sprawdzenie w tablicy friends
    };

    // Sprawdzenie, czy wysłano zaproszenie
    const isInvitationSent = (userId) => {
        return invitationsSent.some(invitation => invitation.receiver && invitation.receiver._id === userId && invitation.status === 'pending');
    };
    console.log(friends)
    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Wyniki wyszukiwania</h1>
            {errorMessage && <div className="text-red-500 mb-4">{errorMessage}</div>}
            <div className="flex flex-col space-y-4">
                {filteredUsers.length > 0 ? (
                    filteredUsers.map(user => (
                        <div key={user._id} className="bg-white shadow-md rounded-lg p-4">
                            <Link to={`/user/${user._id}`} className="block text-lg font-semibold text-blue-600 hover:text-blue-800">
                                {user.firstName} {user.lastName}
                            </Link>
                            <p className="text-gray-600">{user.email}</p>

                            {isFriend(user._id) ? (
                                <button
                                    className="bg-red-500 text-white px-4 py-2 mt-2 hover:bg-red-700"
                                    onClick={() => dispatch(removeFriend(user._id))}>
                                    Usuń znajomego
                                </button>
                            ) : isInvitationSent(user._id) ? (
                                <button
                                    className="bg-red-500 text-white px-4 py-2 mt-2 hover:bg-red-700"
                                    onClick={() => {
                                        const invitation = invitationsSent.find(inv => inv.receiver._id === user._id);
                                        if (invitation) {
                                            dispatch(cancelInvitation(invitation._id)); // Anuluj zaproszenie
                                        }
                                    }}>
                                    Anuluj zaproszenie
                                </button>
                            ) : (
                                <button
                                    className="bg-green-500 text-white px-4 py-2 mt-2 hover:bg-green-700"
                                    onClick={() => dispatch(sendInvitation(user._id))}>
                                    Wyślij zaproszenie
                                </button>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="text-gray-500">Brak użytkowników do wyświetlenia.</div>
                )}
            </div>
        </div>
    );
};

export default SearchResults;
