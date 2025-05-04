import axios from 'axios';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Signup = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: '',
        age: '',
        location: '',
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
        if (formData.password !== formData.confirmPassword) {
            alert('Passwords do not match!');
            return;
        }

        try {
            const response = await axios.post('/api/user/register/', formData, { "headers": { "Content-Type": "application/json" }  });
            console.log('Signup form submitted:', formData);
            navigate('/login');
            // console.log(response);
        } catch (error) {
            console.log(error);
        }
        
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-theme-0">
            <div className="max-w-md w-full p-8 bg-theme-1 rounded-lg shadow-lg">
                <h2 className="text-3xl font-bold text-center text-theme-3 mb-8">Sign Up</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-theme-3">
                            Username
                        </label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            className="mt-1 block w-full px-3 py-2 bg-theme-2 border border-theme-2 rounded-md text-theme-3 placeholder-theme-3 focus:outline-none focus:ring-2 focus:ring-theme-2"
                            required
                        />
                    </div>
                    {/* <div>
            <label htmlFor="email" className="block text-sm font-medium text-theme-3">
            Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 bg-theme-2 border border-theme-2 rounded-md text-theme-3 placeholder-theme-3 focus:outline-none focus:ring-2 focus:ring-theme-2"
              required
            />
            </div> */}
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-theme-3">
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="mt-1 block w-full px-3 py-2 bg-theme-2 border border-theme-2 rounded-md text-theme-3 placeholder-theme-3 focus:outline-none focus:ring-2 focus:ring-theme-2"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-theme-3">
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className="mt-1 block w-full px-3 py-2 bg-theme-2 border border-theme-2 rounded-md text-theme-3 placeholder-theme-3 focus:outline-none focus:ring-2 focus:ring-theme-2"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="age" className="block text-sm font-medium text-theme-3">
                            Age
                        </label>
                        <input
                            type="number"
                            id="age"
                            name="age"
                            value={formData.age}
                            onChange={handleChange}
                            className="mt-1 block w-full px-3 py-2 bg-theme-2 border border-theme-2 rounded-md text-theme-3 placeholder-theme-3 focus:outline-none focus:ring-2 focus:ring-theme-2"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="location" className="block text-sm font-medium text-theme-3">
                            Location
                        </label>
                        <input
                            type="text"
                            id="location"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            className="mt-1 block w-full px-3 py-2 bg-theme-2 border border-theme-2 rounded-md text-theme-3 placeholder-theme-3 focus:outline-none focus:ring-2 focus:ring-theme-2"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-theme-1 bg-theme-3 hover:bg-theme-2 hover:text-theme-3 hover:outline hover:outline-1 hover:outline-theme-3 "
                    >
                        Sign up
                    </button>
                </form>
                <p className="mt-4 text-center text-sm text-theme-3">
                    Already have an account?{' '}
                    <Link to="/login" className="font-medium text-theme-2 hover:text-theme-3">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Signup;