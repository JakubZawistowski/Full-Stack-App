import axios from 'axios';
import {
    setFriends,
    setInvitations,
    addInvitation,
    removeInvitation,
    removeFriend as removeFriendAction
} from './friendsReducer';

// Akcja do usuwania znajomego
export const removeFriend = (friendId) => {
    return async (dispatch, getState) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.delete(`http://localhost:3002/api/friends/remove/${friendId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            alert(response.data.message);
            // Pobierz zaktualizowaną listę znajomych po usunięciu
            const userId = getState().auth.user.id; // Pobierz ID zalogowanego użytkownika
            const updatedFriends = await axios.get(`http://localhost:3002/api/users/${userId}/friends`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            // Zaktualizuj znajomych w Reduxie
            dispatch(setFriends(updatedFriends.data.friends));
            // Usuń znajomego z globalnego stanu
            dispatch(removeFriendAction(friendId)); // Użyj akcji z reducer
        } catch (error) {
            console.error('Error removing friend:', error);
            alert('Error removing friend');
        }
    };
};

// Akcja do wysyłania zaproszenia
export const sendInvitation = (receiverId) => async (dispatch) => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.post('http://localhost:3002/api/invitations/send',
            { receiverId },
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );
        alert(response.data.message);

        // Dodaj zaproszenie do stanu
        dispatch(addInvitation({
            _id: response.data.invitation._id, // Upewnij się, że używasz ID z odpowiedzi
            receiver: { _id: receiverId }, // Możesz dodać inne właściwości, jeśli są dostępne
            status: 'pending'
        }));
    } catch (error) {
        alert('Error sending invitation');
    }
};

// Akcja do anulowania zaproszenia
export const cancelInvitation = (invitationId) => async (dispatch) => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.post(`http://localhost:3002/api/invitations/decline/${invitationId}`, {}, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        alert(response.data.message);
        dispatch(removeInvitation(invitationId)); // Usuń zaproszenie z stanu
    } catch (error) {
        alert('Error canceling invitation');
    }
};

// Akcja do pobierania znajomych
export const fetchFriends = (userId, token) => async (dispatch) => {
    try {
        const response = await axios.get(`http://localhost:3002/api/users/${userId}/friends`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        dispatch(setFriends(response.data.friends)); // Ustawiamy znajomych w Reduxie
    } catch (error) {
        console.error('Error fetching friends:', error);
    }
};

// Akcja do pobierania wysłanych zaproszeń
export const fetchInvitations = (token) => async (dispatch) => {
    try {
        const response = await axios.get('http://localhost:3002/api/invitations/sent-invitations', {
            headers: { Authorization: `Bearer ${token}` }
        });
        dispatch(setInvitations(response.data)); // Ustaw zaproszenia
    } catch (error) {
        console.error('Error fetching invitations:', error);
    }
};

// Akceptacja zaproszenia
export const acceptInvitation = (invitationId) => async (dispatch) => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.post(`http://localhost:3002/api/invitations/accept/${invitationId}`, {}, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        console.log("response data: ", response.data);
        alert(response.data.message);

        // Po zaakceptowaniu, odśwież znajomych
        const userId = response.data.invitation.receiver; // Pobieramy ID odbiorcy zaproszenia
        const updatedFriends = await axios.get(`http://localhost:3002/api/users/${userId}/friends`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        dispatch(setFriends(updatedFriends.data.friends)); // Zaktualizuj znajomych
        dispatch(removeInvitation(invitationId)); // Usuń zaproszenie z globalnego stanu
    } catch (error) {
        console.error('Error accepting invitation:', error);
        alert('Error accepting invitation');
    }
};

// Odrzucenie zaproszenia
export const declineInvitation = (invitationId) => async (dispatch) => {
    try {
        const token = localStorage.getItem('token');
        await axios.post(`http://localhost:3002/api/invitations/decline/${invitationId}`, {}, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        dispatch(removeInvitation(invitationId)); // Usuń odrzucone zaproszenie z globalnego stanu
        alert('Invitation declined!');
    } catch (error) {
        console.error('Error declining invitation:', error);
        alert('Error declining invitation');
    }
};
