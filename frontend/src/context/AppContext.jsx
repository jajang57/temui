import { createContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from './AuthContext';

export const AppContext = createContext();

export function AppProvider({ children }) {
    const [appMode, setAppMode] = useState('client'); // 'client' | 'consultant'
    const [activeClient, setActiveClient] = useState(() => {
        const saved = localStorage.getItem('activeClient');
        return saved ? JSON.parse(saved) : null;
    }); // { id, name, url }
    const [clientList, setClientList] = useState([]);
    const [loadingConfig, setLoadingConfig] = useState(true);

    const { user } = useAuth();

    // Init: Check Mode from Backend
    useEffect(() => {
        // We fetch the mode first
        api.get('/config/mode').then(res => {
            setAppMode(res.data.mode);
            setLoadingConfig(false);
            if (res.data.mode === 'consultant') {
                fetchClientList();
            }
        }).catch(err => {
            console.error("Failed to load app config", err);
            setLoadingConfig(false);
            // Fallback strategy: If user is consultant, force mode
            if (user?.role === 'consultant') {
                setAppMode('consultant');
                fetchClientList();
            }
        });
    }, [user]);

    const fetchClientList = () => {
        api.get('/consultant/clients').then(res => {
            setClientList(res.data);
        });
    };

    // Interceptor: Attach Target Header automatically to every request
    // Need to ensure this doesn't stack listeners
    // Interceptor moved to utils/api.js for better persistence stability
    // useEffect(() => { ... }, [appMode, activeClient]);

    return (
        <AppContext.Provider value={{ appMode, activeClient, setActiveClient, clientList, loadingConfig }}>
            {children}
        </AppContext.Provider>
    );
}
