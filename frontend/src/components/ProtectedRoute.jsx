import { Navigate, useLocation } from 'react-router-dom';
import { useUserContext } from '../contexts/userContext';

const ProtectedRoute = ({ children }) => {
    const { token } = useUserContext();
    const location = useLocation();

    if (!token) {
        // Redirect to login page but save the attempted location
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
};

export default ProtectedRoute; 