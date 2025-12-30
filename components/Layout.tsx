import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { User } from '../types';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

interface LayoutProps {
    user: User;
    onLogout: () => void;
    onSwitchProfile: () => void;
}

const Layout: React.FC<LayoutProps> = ({
    user,
    onLogout,
    onSwitchProfile
}) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen bg-stone-50 overflow-hidden font-inter">
            <Sidebar
                isOpen={isSidebarOpen}
                setIsOpen={setIsSidebarOpen}
                user={user}
            />

            <div className="flex-1 flex flex-col overflow-hidden relative">
                <Navbar
                    user={user}
                    onLogout={onLogout}
                    onSwitchProfile={onSwitchProfile}
                    onOpenSidebar={() => setIsSidebarOpen(true)}
                />

                <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8 lg:p-16 bg-stone-50 scroll-smooth">
                    <div className="max-w-[1400px] mx-auto animate-in fade-in duration-500">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;
