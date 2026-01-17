import { useState } from 'react';
import { pollEmails } from '../api';
import '../styles/Emails.css';

const Emails = () => {
    const [emails, setEmails] = useState([]);

    const handlePoll = async () => {
        try {
            const response = await pollEmails();
            setEmails(response.data);
        } catch (error) {
            console.error('Error polling emails:', error);
        }
    };

    return (
        <div className="emails-page">
            <h1>Emails</h1>
            <button onClick={handlePoll}>Poll for Unread Emails</button>
            <ul>
                {emails?.map((email, index) => (
                    <li key={index}>
                        <h3>{email.subject}</h3>
                        <p>From: {email.from}</p>
                        <p>{email.body}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Emails;