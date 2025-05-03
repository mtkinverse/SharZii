import { Link } from 'react-router-dom';

const Home = () => {
  const token = localStorage.getItem('token');

  return (
    <div className="bg-theme-0">
      {/* Navigation Bar */}
      <nav className="bg-theme-1 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-theme-3">Sharzii</h1>
          {/* <div className="space-x-4">
            <Link to="/login" className="text-theme-3 hover:text-theme-2">Login</Link>
            <Link to="/signup" className="text-theme-3 hover:text-theme-2">Sign Up</Link>
          </div> */}
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto my-20 px-4 py-16">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-theme-3 mb-4">Welcome to Real-Time Messaging</h2>
          <p className="text-xl text-theme-3 mb-8">Connect with friends and family instantly</p>
          <div className="space-x-4">
            <Link
              to={token ? "/messages" : "/login"}
              className="bg-theme-2 text-theme-3 px-6 py-3 rounded-md hover:bg-theme-1 transition-colors"
            >
              Get Started
            </Link>
            {!token &&
              <Link
              to="/signup"
              className="bg-theme-1 text-theme-3 px-6 py-3 rounded-md hover:bg-theme-2 transition-colors"
            >
              Create Account
            </Link>}
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-theme-1 p-6 rounded-lg hover:outline hover:outline-1 hover:outline-theme-3 cursor-pointer transition-all duration-500">
            <h3 className="text-xl font-semibold text-theme-3 mb-2">Real-Time Chat</h3>
            <p className="text-theme-3">Experience instant messaging with our real-time chat system.</p>
          </div>
          <div className="bg-theme-1 p-6 rounded-lg hover:outline hover:outline-1 hover:outline-theme-3 cursor-pointer transition-all duration-500-lg">
            <h3 className="text-xl font-semibold text-theme-3 mb-2">Secure Communication</h3>
            <p className="text-theme-3">Your messages are encrypted and secure.</p>
          </div>
          <div className="bg-theme-1 p-6 rounded-lg hover:outline hover:outline-1 hover:outline-theme-3 cursor-pointer transition-all duration-500">
            <h3 className="text-xl font-semibold text-theme-3 mb-2">Easy to Use</h3>
            <p className="text-theme-3">Simple and intuitive interface for seamless communication.</p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Home;