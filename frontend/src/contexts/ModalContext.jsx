import { createContext, useContext, useState } from 'react';
import Modal from '../components/Modal';

const ModalContext = createContext();

export const ModalProvider = ({ children }) => {
    const [modal, setModal] = useState(null);

    const showModal = ({ title, text, options }) => {
        return new Promise((resolve) => {
            const handleClose = (selectedOption) => {
                setModal(null);
                resolve(selectedOption);
            };

            setModal(
                <Modal
                    title={title}
                    text={text}
                    options={options}
                    onClose={handleClose}
                />
            );
        });
    };

    return (
        <ModalContext.Provider value={{ showModal }}>
            {children}
            {modal}
        </ModalContext.Provider>
    );
};

export const useModal = () => {
    const context = useContext(ModalContext);
    if (!context) {
        throw new Error('useModal must be used within a ModalProvider');
    }
    return context;
}; 