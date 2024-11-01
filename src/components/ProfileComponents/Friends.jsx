import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useParams } from 'react-router-dom';

export default function Friends() {
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const { userId } = useParams(); // Pobieramy ID użytkownika z URL

    useEffect(() => {
        const fetchFriends = async () => {
            setLoading(true); // Ustawiamy ponownie `loading` na true
            setFriends([]); // Resetujemy listę znajomych, aby nie pokazywać poprzednich danych

            try {
                const token = localStorage.getItem('token');
                const userIdToFetch = userId || 'me'; // Jeśli `userId` nie istnieje, pobieramy znajomych dla aktualnie zalogowanego użytkownika

                const response = await axios.get(`http://localhost:3002/api/friends/${userIdToFetch}/friends`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                setFriends(response.data);
            } catch (error) {
                console.error('Error fetching friends:', error);
                setError('Nie udało się pobrać znajomych');
            } finally {
                setLoading(false); // Ustawiamy `loading` na false, niezależnie od wyniku
            }
        };

        fetchFriends();
    }, [userId]); // Odświeżanie listy znajomych, gdy zmienia się `userId`

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div className="text-red-500">{error}</div>;
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">{userId ? 'User friends' : 'Your friends'}</h1>
            {friends.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {friends.map(friend => (
                        <div key={friend._id} className="bg-white shadow-md rounded-lg p-4">
                            <Link to={`/user/${friend._id}`} className="block text-lg font-semibold text-blue-600 hover:text-blue-800">
                                {friend.firstName} {friend.lastName}
                            </Link>
                            {friend.profilePicture ? (
                                <img
                                    src={`http://localhost:3002/uploads/profile-pictures/${friend.profilePicture}`}
                                    alt={`${friend.firstName}'s profile`}
                                    className="w-20 h-20 rounded-full object-cover mt-2"
                                />
                            ) : (
                                <div className="w-20 h-20 bg-gray-200 rounded-full mt-2"></div> // Placeholder dla braku zdjęcia
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-gray-500">No friends to display</div>
            )}
        </div>
    );
}
