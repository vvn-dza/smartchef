const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-6">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <h3 className="text-xl font-bold">SmartChef</h3>
            <p className="text-gray-400 mt-1">Your AI-powered cooking assistant</p>
          </div>
          
          <div className="flex space-x-6">
            <a href="/terms" className="hover:text-blue-400 transition">Terms</a>
            <a href="/privacy" className="hover:text-blue-400 transition">Privacy</a>
            <a href="/contact" className="hover:text-blue-400 transition">Contact</a>
          </div>
        </div>
        <div className="mt-6 pt-6 border-t border-gray-700 text-center text-gray-400 text-sm">
          © {new Date().getFullYear()} SmartChef. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;