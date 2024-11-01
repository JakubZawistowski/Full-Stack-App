import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../redux/auth'; // Importujemy akcję loginSuccess
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { fetchFriends } from '../redux/friendsActions'; // Importujemy akcję do pobierania znajomych

const Login = () => {
    const [form, setForm] = useState({
        email: '',
        password: ''
    });
    const [errorMessage, setErrorMessage] = useState(''); // Stan do przechowywania komunikatu o błędzie
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('http://localhost:3002/api/users/login', form);
            dispatch(loginSuccess(res.data.user)); // Ustawiamy użytkownika w Redux
            localStorage.setItem('token', res.data.token);

            // Wywołanie akcji do pobrania znajomych
            dispatch(fetchFriends(res.data.user.id, res.data.token));

            navigate('/'); // Przekierowanie po zalogowaniu
        } catch (err) {
            console.error(err.response ? err.response.data : err.message);
            setErrorMessage(err.response ? err.response.data.message : 'An error occurred.'); // Ustawiamy komunikat o błędzie
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100">
            <div className="bg-white p-8 rounded shadow-lg max-w-md w-full">
                <h2 className="text-2xl mb-4">Login</h2>
                {errorMessage && <p className="text-red-500 mb-4">{errorMessage}</p>} {/* Wyświetlamy komunikat o błędzie */}
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block mb-2">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border rounded"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block mb-2">Password</label>
                        <input
                            type="password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border rounded"
                        />
                    </div>
                    <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
                        Login
                    </button>
                </form>
                <Link to="/register" className="text-black hover:text-blue-600">No account? Register</Link>
            </div>
        </div>
    );
};

export default Login;
