import React from 'react';

const Modal = ({ isOpen, onRequestClose, contentLabel, children }) => {
    if (!isOpen) return null; // Nie renderuj, jeśli modal nie jest otwarty

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50" onClick={onRequestClose}>
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-xl font-semibold mb-4">{contentLabel}</h2>
                {children}
                <div className="flex justify-end mt-4">
                    <button className="mr-2 px-4 py-2 bg-gray-300 text-black rounded-md hover:bg-gray-400" onClick={onRequestClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Modal;
