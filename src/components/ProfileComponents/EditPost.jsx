import React, { useState, useEffect } from 'react';
import axios from 'axios';

const EditPost = ({ postId, onClose }) => {
    const [postContent, setPostContent] = useState('');
    const [postImage, setPostImage] = useState(null);
    const [currentImage, setCurrentImage] = useState('');

    useEffect(() => {
        // Fetch the current post details when component mounts
        const fetchPost = async () => {
            try {
                const response = await axios.get(`http://localhost:3002/api/posts/${postId}`);
                setPostContent(response.data.content);
                setCurrentImage(response.data.image);
            } catch (error) {
                console.error('Error fetching post details:', error);
            }
        };

        fetchPost();
    }, [postId]);

    const handleContentChange = (e) => setPostContent(e.target.value);

    const handleImageChange = (e) => setPostImage(e.target.files[0]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('content', postContent);
        if (postImage) {
            formData.append('image', postImage);
        }

        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:3002/api/posts/${postId}`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
            });
            onClose(); // Close the edit form after successful submission
        } catch (error) {
            console.error('Error updating post:', error);
        }
    };

    return (
        <div className="edit-post-form">
            <h2>Edit Post</h2>
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label className="block mb-2">Content</label>
                    <textarea
                        value={postContent}
                        onChange={handleContentChange}
                        className="w-full px-3 py-2 border rounded"
                    />
                </div>
                {currentImage && (
                    <div className="mb-4">
                        <img
                            src={`http://localhost:3002/uploads/${currentImage}`}
                            alt="Current Post"
                            className="w-full h-auto max-w-md mx-auto rounded"
                        />
                    </div>
                )}
                <div className="mb-4">
                    <label className="block mb-2">New Image (optional)</label>
                    <input
                        type="file"
                        onChange={handleImageChange}
                        className="w-full px-3 py-2 border rounded"
                    />
                </div>
                <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
                    Save Changes
                </button>
            </form>
            <button onClick={onClose} className="bg-gray-500 text-white px-4 py-2 rounded mt-2">
                Cancel
            </button>
        </div>
    );
};

export default EditPost;
