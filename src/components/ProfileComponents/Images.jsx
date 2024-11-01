import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Images = ({ userId, isCurrentUser }) => {
    const [images, setImages] = useState([]); // Tablica przechowująca zdjęcia
    const [selectedImage, setSelectedImage] = useState(null); // Zdjęcie wybrane do pełnego widoku

    // Pobieranie zdjęć użytkownika
    useEffect(() => {
        const fetchImages = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`http://localhost:3002/api/users/${userId}/photos`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                const imageNames = response.data.map(url => url.split('/').pop()); // Przechowywanie nazw plików
                setImages(imageNames);
            } catch (error) {
                console.error('Błąd podczas pobierania zdjęć:', error);
            }
        };

        fetchImages();
    }, [userId]);

    // Funkcja obsługująca przesyłanie zdjęć
    const handleImageUpload = async (event) => {
        if (!isCurrentUser) return; // Tylko właściciel profilu może przesyłać zdjęcia

        const files = Array.from(event.target.files);
        const formData = new FormData();

        files.forEach((file) => {
            formData.append('photos', file);
        });

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post('http://localhost:3002/api/users/photos/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                }
            });

            setImages((prevImages) => {
                const newImage = response.data[response.data.length - 1];
                const existingImages = new Set(prevImages);
                return [...existingImages, newImage];
            });
        } catch (error) {
            console.error('Błąd podczas przesyłania zdjęcia:', error);
        }
    };

    // Funkcja obsługująca usuwanie zdjęć
    const handleDeleteImage = async (imageUrl) => {
        if (!isCurrentUser) return; // Tylko właściciel profilu może usuwać zdjęcia

        try {
            const token = localStorage.getItem('token');
            const imageName = imageUrl.split('/').pop();

            await axios.delete(`http://localhost:3002/api/users/photos/${imageName}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            setImages((prevImages) => prevImages.filter((image) => image !== imageUrl));
        } catch (error) {
            console.error('Błąd podczas usuwania zdjęcia:', error);
        }
    };

    // Zamknięcie pełnego widoku
    const closeFullScreen = () => {
        setSelectedImage(null);
    };

    return (
        <div className="p-4">
            {isCurrentUser && ( // Przycisk przesyłania plików widoczny tylko dla właściciela
                <div className="mb-4">
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="block w-full text-sm text-gray-500
                                   file:mr-4 file:py-2 file:px-4
                                   file:rounded-md file:border-0
                                   file:text-sm file:font-semibold
                                   file:bg-blue-50 file:text-blue-700
                                   hover:file:bg-blue-100"
                    />
                </div>
            )}

            {/* Wyświetlanie kafelków ze zdjęciami */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {images.map((image, index) => (
                    <div key={index} className="relative">
                        <img
                            src={`http://localhost:3002/uploads/photos/${image}`}
                            alt={`Uploaded ${index}`}
                            className="w-full h-auto cursor-pointer rounded-lg shadow-md"
                            onClick={() => setSelectedImage(image)}
                        />

                        {isCurrentUser && ( // Przycisk usuwania widoczny tylko dla właściciela
                            <button
                                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                                onClick={() => handleDeleteImage(image)}
                            >
                                Usuń
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {/* Pełny widok wybranego zdjęcia */}
            {selectedImage && (
                <div
                    className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-75 z-50"
                    onClick={closeFullScreen}
                >
                    <img
                        src={`http://localhost:3002/uploads/photos/${selectedImage}`}
                        alt="Fullscreen"
                        className="max-w-full max-h-full"
                    />
                    <button
                        className="absolute top-4 right-4 bg-white text-black p-2 rounded-full"
                        onClick={closeFullScreen}
                    >
                        Zamknij
                    </button>
                </div>
            )}
        </div>
    );
};

export default Images;
