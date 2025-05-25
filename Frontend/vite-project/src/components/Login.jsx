import { useState } from "react";
import { useLocation } from "wouter";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { Microscope, Activity, Users, ShieldCheck } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export default function Login() {
    const [, navigate] = useLocation();
    const [selectedRole, setSelectedRole] = useState("doctor");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isRegister, setIsRegister] = useState(false);
    const [name, setName] = useState("");
    const [age, setAge] = useState("");
    const [gender, setGender] = useState("");
    const [address, setAddress] = useState("");
    const { login } = useAuth();
    const [registrationSuccess, setRegistrationSuccess] = useState(false);

    function handleSubmit(e) {
        e.preventDefault();
        setError("");
        setRegistrationSuccess(false);

        if (isRegister) {
            if (!name || !email || !password || !age || !gender || !address) {
                setError("All fields are required");
                return;
            }
            fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password, role: selectedRole, age, gender, address }),
            })
                .then(async (res) => {
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || "Registration failed");
                    setIsRegister(false);
                    setRegistrationSuccess(true);
                    setName("");
                    setEmail("");
                    setPassword("");
                    setAge("");
                    setGender("");
                    setAddress("");
                })
                .catch((err) => {
                    setRegistrationSuccess(false);
                    setError(err.message);
                });
            return;
        }
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password, role: selectedRole }),
        })
            .then(async (res) => {
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Login failed");

                login(data.user, data.token);
                //console.log(data.user);
                if (data.user.role === "doctor") navigate("/doctor/dashboard");
                //console.log(data.user.role);
                else if (data.user.role === "pathologist") navigate("/pathologist/dashboard");
                else if (data.user.role === "patient") navigate("/patient/dashboard");
            })
            .catch((err) => setError(err.message));
    }

    return (
        <HelmetProvider>
            <Helmet>
                <title>Login | LeukemiaDetect</title>
                <meta name="description" content="Log in to LeukemiaDetect - Advanced Leukemia Diagnostic Platform" />
            </Helmet>

            <div className="flex flex-col md:flex-row w-full h-screen">

                <div className="w-full md:w-1/2 h-full bg-gradient-to-br from-blue-800 via-blue-700 to-blue-900 p-8 pt-16 md:p-12 flex flex-col justify-start md:justify-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-30">
                        <div className="absolute top-0 right-0 w-full h-1/3 bg-gradient-to-b from-blue-500/20 to-transparent"></div>
                        <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-blue-900/30 to-transparent"></div>
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-700/0 to-blue-900/40"></div>
                    </div>

                    <div className="absolute top-0 left-0 w-full h-full opacity-10">
                        <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-white blur-3xl"></div>
                        <div className="absolute bottom-10 right-10 w-60 h-60 rounded-full bg-blue-300 blur-3xl"></div>
                    </div>

                    <div className="relative z-10 mx-auto max-w-lg px-4 pt-6">
                        <div className="mt-20 md:mt-0 flex items-center mb-6">
                            <div className="flex items-center">
                                <Microscope className="h-8 w-8 text-blue-300 mr-3" />
                                <h1 className="text-2xl font-bold text-white tracking-tight">LeukemiaDetect</h1>
                            </div>
                        </div>

                        <h2 className="text-3xl font-bold text-white mb-3 leading-tight">
                            AI-Powered Leukemia Diagnosis Platform
                        </h2>

                        <p className="text-base text-blue-100 mb-8 opacity-75">
                            Advanced diagnostics for better patient outcomes with intelligent analysis.
                        </p>

                        <div className="space-y-4">
                            {[{
                                icon: <Microscope className="h-5 w-5 text-white" />,
                                title: "AI-Powered Analysis",
                                desc: "Machine learning detection of leukemia from blood samples with high precision.",
                            }, {
                                icon: <Activity className="h-5 w-5 text-white" />,
                                title: "Precise Diagnostics",
                                desc: "Advanced cellular analysis with accuracy rates exceeding 95%.",
                            }, {
                                icon: <Users className="h-5 w-5 text-white" />,
                                title: "Collaborative Workflow",
                                desc: "Seamless cooperation between pathologists and doctors for better outcomes.",
                            }, {
                                icon: <ShieldCheck className="h-5 w-5 text-white" />,
                                title: "Secure Access",
                                desc: "Role-based permissions and HIPAA-compliant data protection standards.",
                            }].map((item, index) => (
                                <div
                                    key={index}
                                    className="flex items-start space-x-4 bg-white/10 backdrop-blur-md p-3 rounded-lg hover:translate-x-2 transition-all duration-300 shadow-md shadow-blue-900/30"
                                >
                                    <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-900/50 flex-shrink-0">
                                        {item.icon}
                                    </div>
                                    <div>
                                        <h3 className="text-white font-semibold text-base">{item.title}</h3>
                                        <p className="text-blue-100 mt-1 text-sm opacity-80">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>


                <div className="w-full md:w-1/2 h-full bg-gray-950 p-8 md:p-12 flex items-center justify-center">
                    <div className="w-full max-w-md bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl shadow-lg p-8 space-y-6 transition-all">
                        <div className="text-center">
                            <h2 className="text-3xl font-bold text-white">{isRegister ? "Create Account" : "Welcome Back"}</h2>
                            <p className="text-gray-400 mt-1 text-sm">{isRegister ? "Sign up to start using the platform" : "Sign in to access your account"}</p>
                        </div>

                        {registrationSuccess && (
                            <div className="bg-green-500 text-white text-center p-3 rounded-md text-sm mb-4">
                                Registration successful! Please log in with your credentials.
                            </div>
                        )}

                        {error && !registrationSuccess && (
                            <div className="text-red-500 text-center text-sm mb-4 p-2 bg-red-100 border border-red-400 rounded-md">{error}</div>
                        )}

                        <div className="flex justify-center gap-2">
                            {["doctor", "pathologist", "patient"].map((role) => (
                                <button
                                    key={role}
                                    type="button"
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedRole === role
                                        ? "bg-blue-600 text-white shadow-md shadow-blue-900"
                                        : "bg-gray-800 text-gray-300 hover:bg-blue-700 hover:text-white"
                                        }`}
                                    onClick={() => setSelectedRole(role)}
                                >
                                    {role.charAt(0).toUpperCase() + role.slice(1)}
                                </button>
                            ))}
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {isRegister && (
                                <>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
                                        placeholder="Full Name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        autoComplete="name"
                                        required
                                    />
                                    <input
                                        type="number"
                                        className="w-full px-4 py-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
                                        placeholder="Age"
                                        value={age}
                                        onChange={e => setAge(e.target.value)}
                                        min="0"
                                        required
                                    />
                                    <select
                                        className="w-full px-4 py-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
                                        value={gender}
                                        onChange={e => setGender(e.target.value)}
                                        required
                                    >
                                        <option value="">Select Gender</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
                                        placeholder="Address"
                                        value={address}
                                        onChange={e => setAddress(e.target.value)}
                                        required
                                    />
                                </>
                            )}
                            <input
                                type="email"
                                className="w-full px-4 py-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="username"
                                required
                            />
                            <input
                                type="password"
                                className="w-full px-4 py-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="current-password"
                                required
                            />
                            <button
                                type="submit"
                                className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all shadow-lg shadow-blue-900/30"
                            >
                                {isRegister ? "Register" : "Sign In"}
                            </button>
                        </form>
                        <div className="text-center mt-4">
                            <button
                                type="button"
                                className="text-blue-400 hover:underline text-sm"
                                onClick={() => { setIsRegister(r => !r); setError(""); setRegistrationSuccess(false); }}
                            >
                                {isRegister ? "Already have an account? Log in" : "Don't have an account? Register"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </HelmetProvider>
    );
}
