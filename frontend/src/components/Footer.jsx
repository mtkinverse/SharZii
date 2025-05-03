import { Link } from "react-router-dom";

const Footer = () => {
    return(
        <footer className="bg-theme-1/80 backdrop-blur-sm mt-0 relative bottom-0 w-full">
          <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <h4 className="text-lg font-semibold text-theme-3 mb-4">About Us</h4>
                <p className="text-theme-3/80">A modern messaging platform for seamless communication.</p>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-theme-3 mb-4">Quick Links</h4>
                <ul className="space-y-2">
                  <li><Link to="/" className="text-theme-3/80 hover:text-theme-3 transition-colors">Home</Link></li>
                  <li><Link to="/login" className="text-theme-3/80 hover:text-theme-3 transition-colors">Login</Link></li>
                  <li><Link to="/signup" className="text-theme-3/80 hover:text-theme-3 transition-colors">Sign Up</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-theme-3 mb-4">Contact</h4>
                <ul className="space-y-2">
                  <li className="text-theme-3/80">Email: support@sharzii.com</li>
                  <li className="text-theme-3/80">Phone: +1 (123) 456-7890</li>
                </ul>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-theme-3 mb-4">Follow Us</h4>
                <div className="flex space-x-4">
                  <a href="#" className="text-theme-3/80 hover:text-theme-3 transition-colors">Twitter</a>
                  <a href="#" className="text-theme-3/80 hover:text-theme-3 transition-colors">Facebook</a>
                  <a href="#" className="text-theme-3/80 hover:text-theme-3 transition-colors">Instagram</a>
                </div>
              </div>
            </div>
            <div className="border-t border-theme-2/30 mt-8 pt-8 text-center text-theme-3/80">
              <p>&copy; 2024 Sharzii. All rights reserved.</p>
            </div>
          </div>
        </footer>

    );
}

export default Footer;
