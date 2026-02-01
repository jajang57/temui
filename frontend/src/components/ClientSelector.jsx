import { useContext } from 'react';
import { AppContext } from '../context/AppContext';

export default function ClientSelector({ isSidebar = false }) {
    const { appMode, activeClient, setActiveClient, clientList } = useContext(AppContext);

    if (appMode !== 'consultant') return null;

    const handleChange = (e) => {
        const clientId = e.target.value;
        const client = clientList.find(c => c.id === clientId);
        setActiveClient(client || null);

        // Save to local storage for persistence
        if (client) {
            localStorage.setItem('activeClient', JSON.stringify(client));
        } else {
            localStorage.removeItem('activeClient');
        }
    };

    return (
        <div className={`flex ${isSidebar ? 'flex-col items-stretch gap-1' : 'items-center gap-2'} bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-lg w-full transition-all`}>
            <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold bg-amber-500 text-black px-1.5 py-0.5 rounded tracking-wide uppercase">
                    CONSULTANT
                </span>
                {isSidebar && (
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" title="Active"></div>
                )}
            </div>
            <select
                className={`bg-transparent text-white text-sm font-medium outline-none cursor-pointer ${isSidebar ? 'w-full' : 'min-w-[150px]'}`}
                value={activeClient?.id || ""}
                onChange={handleChange}
            >
                <option value="" className="text-black">-- Select Client --</option>
                {clientList.map(c => (
                    <option key={c.id} value={c.id} className="text-black">
                        {c.name}
                    </option>
                ))}
            </select>
        </div>
    );
}
