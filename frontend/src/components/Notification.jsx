import { useState, useEffect } from 'react';
import '../styles/Notification.css';

const Notification = ({ message, type = 'info', duration = 3000, onClose }) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => {
                setIsVisible(false);
                onClose && onClose();
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [duration, onClose]);

    if (!isVisible) return null;

    return (
        <div className={`notification ${type}`}>
            <span className="notification-message">{message}</span>
            <button
                className="notification-close"
                onClick={() => {
                    setIsVisible(false);
                    onClose && onClose();
                }}
            >
                ×
            </button>
        </div>
    );
};

export default Notification;