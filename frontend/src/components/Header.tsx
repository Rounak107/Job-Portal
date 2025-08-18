import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="bg-white shadow mb-6">
      <div className="max-w-5xl mx-auto flex justify-between items-center p-4">
        <Link to="/" className="text-xl font-bold">
          Job Portal
        </Link>

        <nav className="flex gap-4">
          {user ? (
            <>
              <span className="text-gray-700">
                Hello, {user.name} ({user.role})
              </span>
              {user.role === "RECRUITER" || user.role === "ADMIN" ? (
                <Link to="/recruiter" className="text-blue-600 hover:underline">
                  Dashboard
                </Link>
              ) : null}
              <button
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
                className="text-red-500 hover:underline"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-blue-600 hover:underline">
                Login
              </Link>
              <Link to="/register" className="text-blue-600 hover:underline">
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
