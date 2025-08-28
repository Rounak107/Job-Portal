import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
    setIsMenuOpen(false);
  };

  const canOpenSelfProfile = user?.role === "USER";

  return (
    <>
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-white/95 backdrop-blur-lg border-b border-gray-200 shadow-xl"
            : "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link to="/" className="flex items-center space-x-2 text-2xl font-bold">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center"
                >
                  <span className="text-white font-bold text-sm">J</span>
                </motion.div>
                 <span
                    className={`text-lg sm:text-2xl ${
                      isScrolled ? "text-gray-800" : "text-white"
                    }`}
                  >
                  Job<span className={isScrolled ? 'text-indigo-600' : 'text-yellow-300'}>Portal</span>
                </span>
              </Link>
            </motion.div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              {user ? (
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                  className="flex items-center space-x-6"
                >
                  {/* Avatar + Greeting (clickable only for USER) */}
                  {canOpenSelfProfile ? (
                    <Link to="/profile" className="flex items-center space-x-3">
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg cursor-pointer"
                        title="View Profile"
                      >
                        <span className="text-white font-semibold text-sm">
                          {user.name?.charAt(0)?.toUpperCase()}
                        </span>
                      </motion.div>
                      <div className={isScrolled ? 'text-gray-800' : 'text-white'}>
                        <p className="font-medium">Hello, {user.name}!</p>
                        <p className={`text-xs capitalize ${isScrolled ? 'text-gray-600' : 'text-white/80'}`}>
                          {user.role}
                        </p>
                      </div>
                    </Link>
                  ) : (
                    <div className="flex items-center space-x-3 select-none cursor-default">
                      <div
                        className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg"
                        title={user.role}
                      >
                        <span className="text-white font-semibold text-sm">
                          {user.name?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                      <div className={isScrolled ? 'text-gray-800' : 'text-white'}>
                        <p className="font-medium">Hello, {user.name}!</p>
                        <p className={`text-xs capitalize ${isScrolled ? 'text-gray-600' : 'text-white/80'}`}>
                          {user.role}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Dashboard Button for Recruiter/Admin */}
                  {(user.role === "RECRUITER" || user.role === "ADMIN") && (
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Link
                        to="/recruiter"
                        className={`group relative px-6 py-3 rounded-full transition-all duration-300 shadow-lg border ${
                          isScrolled
                            ? 'bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100'
                            : 'bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white hover:text-indigo-600'
                        }`}
                      >
                        <span className="flex items-center space-x-2">
                          <svg className={`w-4 h-4 ${isScrolled ? 'text-indigo-600' : 'text-white'}`} fill="currentColor" viewBox="0 0 20 20">
                            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                          </svg>
                          <span>Dashboard</span>
                        </span>
                      </Link>
                    </motion.div>
                  )}

                  {/* Logout */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleLogout}
                    className={`group relative px-6 py-3 rounded-full transition-all duration-300 shadow-lg ${
                      isScrolled
                        ? 'bg-red-600 text-white hover:bg-red-700 border border-red-600'
                        : 'bg-red-500/90 text-white hover:bg-red-600 border border-red-400/50'
                    }`}
                  >
                    <span className="flex items-center space-x-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                      </svg>
                      <span>Logout</span>
                    </span>
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                  className="flex items-center space-x-4"
                >
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link
                      to="/login"
                      className={`px-6 py-3 rounded-full transition-all duration-300 shadow-lg border ${
                        isScrolled
                          ? 'bg-white text-indigo-600 border-indigo-600 hover:bg-indigo-600 hover:text-white'
                          : 'bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white hover:text-indigo-600'
                      }`}
                    >
                      Login
                    </Link>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link
                      to="/register"
                      className="px-6 py-3 bg-yellow-400 text-indigo-900 rounded-full hover:bg-yellow-300 transition-all duration-300 shadow-lg font-medium"
                    >
                      Get Started
                    </Link>
                  </motion.div>
                </motion.div>
              )}
            </nav>

            {/* Mobile Menu Button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`md:hidden p-2 rounded-lg transition-colors ${
                isScrolled ? 'text-gray-800 hover:bg-gray-100' : 'text-white hover:bg-white/20'
              }`}
            >
              <motion.div animate={{ rotate: isMenuOpen ? 90 : 0 }} transition={{ duration: 0.2 }}>
                {isMenuOpen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </motion.div>
            </motion.button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className={`md:hidden border-t ${
                isScrolled ? 'bg-white/95 backdrop-blur-lg border-gray-200' : 'bg-white/10 backdrop-blur-lg border-white/20'
              }`}
            >
              <div className="px-4 py-6 space-y-4">
                {user ? (
                  <>
                    <motion.div
                      initial={{ x: -50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.1 }}
                      className={`flex items-center space-x-3 pb-4 border-b ${
                        isScrolled ? 'border-gray-200' : 'border-white/20'
                      }`}
                    >
                      {canOpenSelfProfile ? (
                        <Link to="/profile" onClick={() => setIsMenuOpen(false)}>
                          <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold">
                              {user.name?.charAt(0)?.toUpperCase()}
                            </span>
                          </div>
                        </Link>
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center select-none cursor-default">
                          <span className="text-white font-semibold">
                            {user.name?.charAt(0)?.toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className={isScrolled ? 'text-gray-800' : 'text-white'}>
                        <p className="font-medium">{user.name}</p>
                        <p className={`text-sm capitalize ${isScrolled ? 'text-gray-600' : 'text-white/80'}`}>
                          {user.role}
                        </p>
                      </div>
                    </motion.div>

                    {(user.role === "RECRUITER" || user.role === "ADMIN") && (
                      <motion.div initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
                        <Link
                          to="/recruiter"
                          onClick={() => setIsMenuOpen(false)}
                          className={`block w-full text-left px-4 py-3 rounded-lg transition-colors ${
                            isScrolled
                              ? 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'
                              : 'text-white bg-white/20 hover:bg-white/30'
                          }`}
                        >
                          Dashboard
                        </Link>
                      </motion.div>
                    )}

                    <motion.button
                      initial={{ x: -50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-3 text-white bg-red-500/80 rounded-lg hover:bg-red-600 transition-colors"
                    >
                      Logout
                    </motion.button>
                  </>
                ) : (
                  <>
                    <motion.div initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
                      <Link
                        to="/login"
                        onClick={() => setIsMenuOpen(false)}
                        className={`block w-full text-center px-4 py-3 rounded-lg transition-colors ${
                          isScrolled
                            ? 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'
                            : 'text-white bg-white/20 hover:bg-white/30'
                        }`}
                      >
                        Login
                      </Link>
                    </motion.div>
                    <motion.div initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
                      <Link
                        to="/register"
                        onClick={() => setIsMenuOpen(false)}
                        className="block w-full text-center px-4 py-3 text-indigo-900 bg-yellow-400 rounded-lg hover:bg-yellow-300 transition-colors font-medium"
                      >
                        Get Started
                      </Link>
                    </motion.div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      <div className="h-28"></div>
    </>
  );
}
