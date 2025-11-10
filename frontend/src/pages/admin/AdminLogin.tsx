import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { setAuthToken } from "../../api";

const ALLOWED_ADMINS = ["rajugroupinfo@gmail.com", "rounakbhuiya@gmail.com"];
const ADMIN_PASSWORD = "Rahul@338";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(""); // optional, static
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  if (ALLOWED_ADMINS.includes(email) && password === ADMIN_PASSWORD) {
    // ✅ Set the dummy-admin token in the RIGHT storage key
    localStorage.setItem("jobportal_token", "dummy-admin");
    localStorage.setItem("isAdmin", "true");
    localStorage.setItem("adminEmail", email);
    
    // ✅ Force set the token in axios headers
    setAuthToken("dummy-admin");
    
    navigate("/admin");
  } else {
    setError("Access denied. Only authorized admins can login.");
  }
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form
        onSubmit={handleSubmit}
        className="p-6 bg-white shadow-md rounded w-96 space-y-4"
      >
        <h1 className="text-xl font-bold">Admin Login</h1>

        <input
          type="email"
          placeholder="Email"
          className="w-full border p-2 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password (optional)"
          className="w-full border p-2 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p className="text-red-600">{error}</p>}

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded"
        >
          Login
        </button>
      </form>
    </div>
  );
}
