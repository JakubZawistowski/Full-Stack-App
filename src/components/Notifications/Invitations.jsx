import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { acceptInvitation, declineInvitation } from "../../redux/friendsActions";
import {setInvitations} from "../../redux/friendsReducer";

const Invitations = () => {
    const [loading, setLoading] = useState(true);
    const dispatch = useDispatch();
    const invitations = useSelector(state => state.friends.invitationsSent); // Pobieranie zaproszeń z Redux
    const token = localStorage.getItem('token');

    useEffect(() => {
        const fetchInvitations = async () => {
            try {
                const response = await axios.get('http://localhost:3002/api/invitations/my-invitations', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                dispatch(setInvitations(response.data)); // Ustaw zaproszenia w Reduxie
            } catch (error) {
                console.error('Error fetching invitations:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchInvitations();
    }, [token, dispatch]); // Dodaj `dispatch` do zależności, aby upewnić się, że działa poprawnie

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Received invitations</h1>
            {invitations.length > 0 ? (
                invitations.map(invitation => (
                    <div key={invitation._id} className="bg-white shadow-md rounded-lg p-4 mb-4">
                        <p>
                            Invitation from: {invitation.sender.firstName} {invitation.sender.lastName}
                        </p>
                        <div className="flex space-x-2">
                            <button
                                className="bg-green-500 text-white px-4 py-2 mt-2"
                                onClick={() => dispatch(acceptInvitation(invitation._id))} // Wywołaj dispatch
                            >
                                Accept
                            </button>
                            <button
                                className="bg-red-500 text-white px-4 py-2 mt-2"
                                onClick={() => dispatch(declineInvitation(invitation._id))} // Wywołaj dispatch
                            >
                                Reject
                            </button>
                        </div>
                    </div>
                ))
            ) : (
                <div className="text-gray-500">No invitations to display.</div>
            )}
        </div>
    );
};

export default Invitations;
