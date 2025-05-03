import { useEffect, useRef } from 'react';

const Modal = ({ title, text, options, onClose }) => {
    const modalRef = useRef(null);

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    const handleOptionClick = (key) => {
        onClose(key);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div 
                ref={modalRef}
                className="bg-theme-5 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl"
            >
                <div className="mb-4">
                    <h2 className="text-2xl font-semibold text-theme-3">{title}</h2>
                    <p className="mt-2 text-theme-3/80">{text}</p>
                </div>

                <div className="flex justify-end space-x-3">
                    {Object.entries(options).map(([key, label]) => (
                        <button
                            key={key}
                            onClick={() => handleOptionClick(key)}
                            className="px-4 py-2 rounded-lg bg-theme-0 text-theme-3 hover:bg-theme-1 transition-colors"
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Modal; 