import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useUserContext } from '../contexts/userContext';

const linkData = [
    {
        to: '/',
        text: 'Home',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
        )
    },
    {
        to: '/profile',
        text: 'Profile',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
        )
    },
    {
        to: '/messages',
        text: 'Messages',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
        )
    },
    {
        to: '/login',
        text: 'Login',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
        )
    },
    {
        to: '/signup',
        text: 'Sign Up',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
        )
    }
];

const Navbar = () => {

    const { token, logout } = useUserContext()
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [navLinks, setNavLinks] = useState(linkData)
    const navigate = useNavigate()

    useEffect(() => {
        if (token) {
            setNavLinks(linkData.filter(link => link.to !== '/login' && link.to !== '/signup'))
        } else {
            setNavLinks(linkData)
        }
    }, [token])

    const logoutUser = () => {
        logout();
        navigate('/login');
    }

    return (
        <div
            className={`fixed right-0 top-0 h-full bg-theme-0 transition-all duration-300 shadow-lg flex flex-col bg-theme-1/30 backdrop-blur-sm p-4 hover:bg-theme-1/90 z-50 ${isCollapsed ? 'w-16' : 'w-50'
                }`}
        >
            {/* Toggle button */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute -left-3 top-6 bg-theme-1 text-theme-3 rounded-full p-1 shadow-lg hover:bg-theme-2 transition-colors"
            >
                {isCollapsed ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path
                            fillRule="evenodd"
                            d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                            clipRule="evenodd"
                        />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path
                            fillRule="evenodd"
                            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                            clipRule="evenodd"
                        />
                    </svg>
                )}
            </button>

            {/* Logo */}
            <div className="flex justify-center items-center h-20 border-b border-theme-6">
                <div className="text-theme-3 font-bold text-2xl">{isCollapsed ? 'S' : 'Sharezii'}</div>
            </div>

            {/* Nav Links */}
            <div className="flex flex-col flex-grow py-8">
                {navLinks.map(({ to, icon, text }) => (
                    <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) =>
                            `
                flex items-center px-4 py-3 mb-2 transition-colors rounded-l-lg
                ${isCollapsed ? 'justify-center rounded-r-md' : ''}
                ${isActive ? 'bg-theme-2 text-white' : 'hover:bg-theme-2 text-theme-3'}
              `
                        }
                    >
                        <div className="flex items-center">
                            <span className={`${isCollapsed ? '' : 'mr-3'}`}>{icon}</span>
                            {!isCollapsed && <span>{text}</span>}
                        </div>
                    </NavLink>
                ))}
                {token && (
                    <button
                        onClick={logoutUser}
                        className={`flex items-center text-theme-3 hover:text-theme-3 transition-colors hover:shadow-md hover:bg-theme-2 rounded-md p-3 ${isCollapsed ? 'justify-center' : 'justify-start'}`}
                    >
                        <div className="flex-shrink-0 w-5 h-5 ">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-full h-full"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-2.293 2.293z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </div>
                        {!isCollapsed && <span className="ml-3">Logout</span>}
                    </button>

                )}
            </div>
        </div>
    );
};

export default Navbar;
