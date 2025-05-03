import { useUserContext } from "../contexts/userContext";
import { Link } from "react-router-dom";

const Profile = () => {
    const { user } = useUserContext();

    if (!user) {
        return (
            <div className="flex items-center justify-center h-screen bg-theme-4">
                <div className="bg-theme-1 p-8 rounded-lg shadow-lg text-theme-3">
                    <h2 className="text-2xl font-bold mb-4">No user found</h2>
                    <Link to="/login" className="bg-theme-2 text-theme-3 px-4 py-2 rounded hover:bg-theme-0 transition-colors">Login</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-theme-4 flex flex-col items-center justify-center">
            <div className="bg-theme-1 p-8 rounded-lg shadow-lg w-full max-w-md text-theme-3">
                <div className="flex flex-col items-center mb-6">
                    <div className="w-24 h-24 rounded-full bg-theme-7 flex items-center justify-center text-5xl font-bold mb-4">
                        {user.username?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <h2 className="text-3xl font-bold mb-1">{user.username}</h2>
                    {/* Add more user details here if available */}
                </div>
                <div className="space-y-4">
                    {/* Example fields, replace or add more as needed */}
                    <div className="flex justify-between border-b border-theme-6 pb-2">
                        <span className="font-semibold">Username:</span>
                        <span>{user.username}</span>
                    </div>
                    {user.email && (
                        <div className="flex justify-between border-b border-theme-6 pb-2">
                            <span className="font-semibold">Email:</span>
                            <span>{user.email}</span>
                        </div>
                    )}
                    {/* Placeholder for join date or other info */}
                    {user.joined && (
                        <div className="flex justify-between border-b border-theme-6 pb-2">
                            <span className="font-semibold">Joined:</span>
                            <span>{new Date(user.joined).toLocaleDateString()}</span>
                        </div>
                    )}
                </div>
                <div className="mt-8 flex justify-between">
                    <Link to="/" className="bg-theme-2 text-theme-3 px-4 py-2 rounded hover:bg-theme-0 transition-colors">Back to Home</Link>
                    {/* <button className="bg-theme-3 text-theme-2 px-4 py-2 rounded hover:bg-theme-2 hover:text-theme-3 transition-colors">Edit Profile</button> */}
                </div>
            </div>
        </div>
    );
};

export default Profile;