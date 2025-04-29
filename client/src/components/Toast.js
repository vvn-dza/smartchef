import { useEffect, useState } from 'react';
import { FiAlertCircle, FiCheckCircle, FiX } from 'react-icons/fi';

export const Toast = ({ message, type = 'error', duration = 3000, onClose }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!visible) return null;

  const bgColor = type === 'error' ? 'bg-red-100' : 'bg-green-100';
  const textColor = type === 'error' ? 'text-red-700' : 'text-green-700';
  const icon = type === 'error' ? <FiAlertCircle /> : <FiCheckCircle />;

  return (
    <div className={`fixed bottom-4 right-4 ${bgColor} ${textColor} p-4 rounded-lg shadow-lg flex items-center z-50`}>
      <span className="mr-2">{icon}</span>
      <span>{message}</span>
      <button onClick={() => setVisible(false)} className="ml-4">
        <FiX />
      </button>
    </div>
  );
};