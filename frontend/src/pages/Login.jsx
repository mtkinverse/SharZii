import axios from 'axios';
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useUserContext } from '../contexts/userContext';

const Login = () => {
    const {login} = useUserContext();
    const navigate = useNavigate();
    const location = useLocation();
    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('/api/login/', formData, { "headers": { "Content-Type": "application/json" }  });
            console.log('Login form submitted:', formData);

            localStorage.setItem('authToken', response.data.access);
            localStorage.setItem('refresh', response.data.refresh);

            login(formData, response.data.access);
            setFormData({
                username: '',
                password: '',
            });
            console.log(response);
            
            // Redirect to the page the user was trying to access, or home if no previous location
            const from = location.state?.from?.pathname || '/';
            navigate(from, { replace: true });
        } catch (error) {
            console.log(error);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-theme-0">
            <div className="max-w-md w-full p-8 bg-theme-1 rounded-lg shadow-md shadow-theme-3/20">
                <h2 className="text-3xl font-bold text-center text-theme-3 mb-8">Login</h2>
                <form onSubmit={handleSubmit} className="my-2">
                    <div className="mb-4">
                        <label htmlFor="email" className="block text-sm font-medium text-theme-3">
                            Email
                        </label>
                        <input
                            type="text"
                            id="usernmame"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            className="mt-1 block w-full px-3 py-2 bg-theme-2 border border-theme-2 rounded-md text-theme-3 placeholder-theme-3 focus:outline-none focus:ring-2 focus:ring-theme-3"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="password" className="block text-sm font-medium text-theme-3">
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="mt-1 block w-full px-3 py-2 bg-theme-2 border border-theme-2 rounded-md text-theme-3 placeholder-theme-3 focus:outline-none focus:ring-2 focus:ring-theme-3"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="mt-12 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-theme-1 bg-theme-3 hover:bg-theme-2 hover:text-theme-3 hover:outline hover:outline-1 hover:outline-theme-3 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-2"
                    >
                        Sign in
                    </button>
                </form>
                <p className="mt-4 text-center text-sm text-theme-3">
                    Don't have an account?{' '}
                    <Link to="/signup" className="font-medium text-theme-2 hover:text-theme-3">
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Login;