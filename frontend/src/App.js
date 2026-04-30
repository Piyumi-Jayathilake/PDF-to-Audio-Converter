import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { FiUploadCloud } from "react-icons/fi";

function App() {
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [audioUrl, setAudioUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [voice, setVoice] = useState("female");
  const [speed, setSpeed] = useState(1);
  const [files, setFiles] = useState([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [notification, setNotification] = useState(null);
  const fileInputRef = useRef(null);

  const showNotification = (message, type = "info") => {
    setNotification({ message, type });
    window.clearTimeout(showNotification.timer);
    showNotification.timer = window.setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken("");
    setFiles([]);
    setAudioUrl("");
  };

  // Fetch user files
  const fetchFiles = useCallback(async () => {
    if (!token) return;

    try {
      const res = await fetch("http://localhost:8000/files", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401) {
        localStorage.removeItem("token");
        setToken("");
        setFiles([]);
        return;
      }

      if (!res.ok) {
        throw new Error(`Failed to load files: ${res.status}`);
      }

      const data = await res.json();
      setFiles(data);
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  // Login
  const handleLogin = async () => {
    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("password", password);

      const res = await axios.post("http://localhost:8000/login", formData);

      if (res.data.access_token) {
        localStorage.setItem("token", res.data.access_token);
        setToken(res.data.access_token);
        showNotification("Login successful", "success");
      } else {
        showNotification(res.data.error || "Login failed", "error");
      }
    } catch (err) {
      console.error(err.response?.data);
      showNotification("Login failed", "error");
    }
  };

  // Signup
  const handleSignup = async () => {
    if (password !== confirmPassword) {
      showNotification("Passwords do not match", "error");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("password", password);

      const signupRes = await axios.post("http://localhost:8000/signup", formData);

      if (signupRes.data.error) {
        showNotification(signupRes.data.error, "error");
        return;
      }

      const loginFormData = new FormData();
      loginFormData.append("email", email);
      loginFormData.append("password", password);

      const loginRes = await axios.post("http://localhost:8000/login", loginFormData);

      if (loginRes.data.access_token) {
        localStorage.setItem("token", loginRes.data.access_token);
        setToken(loginRes.data.access_token);
        setPassword("");
        setConfirmPassword("");
        showNotification("Registration successful", "success");
      } else {
        showNotification(signupRes.data.message || "Registration successful. Please log in.", "success");
        setIsLogin(true);
      }
    } catch (err) {
      console.error(err.response?.data);
      showNotification("Signup failed", "error");
    }
  };

  const setPdfFile = (selectedFile) => {
    if (!selectedFile) return;

    const isPdfMime = selectedFile.type === "application/pdf";
    const isPdfExt = selectedFile.name.toLowerCase().endsWith(".pdf");

    if (!isPdfMime && !isPdfExt) {
      showNotification("PDF only", "error");
      return;
    }

    setFile(selectedFile);
  };

  // Drag & drop
  const handleDrop = (e) => {
    e.preventDefault();
    setPdfFile(e.dataTransfer.files[0]);
  };

  const handleFileInputChange = (e) => {
    setPdfFile(e.target.files[0]);
  };

  // Upload file
  const uploadFile = async () => {
    if (!file) return showNotification("Select a PDF first", "error");

    setLoading(true);
    setProgress(0);
    setAudioUrl("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("voice", voice);
    formData.append("speed", speed);

    try {
      const res = await axios.post(
        "http://localhost:8000/upload",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const ws = new WebSocket(`ws://localhost:8000/ws/${res.data.file_id}`);

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.progress) setProgress(data.progress);

        if (data.done) {
          setAudioUrl(`http://localhost:8000${data.audio_url}`);
          setLoading(false);
          fetchFiles();
        }

        if (data.error) {
          showNotification(data.error, "error");
          setLoading(false);
        }
      };
    } catch (err) {
      if (err?.response?.status === 401) {
        localStorage.removeItem("token");
        setToken("");
        setFiles([]);
        showNotification("Session expired. Please login again.", "error");
      } else {
        console.error(err);
      }
      setLoading(false);
      if (err?.response?.status !== 401) {
        showNotification("Upload failed", "error");
      }
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-gray-900 text-white">
      {notification && (
        <div className="fixed top-4 right-4 z-50 max-w-sm">
          <div
            className={`rounded-lg px-4 py-3 shadow-lg border text-sm ${
              notification.type === "success"
                ? "bg-green-500/95 border-green-300 text-white"
                : notification.type === "error"
                ? "bg-red-500/95 border-red-300 text-white"
                : "bg-gray-800 border-gray-600 text-white"
            }`}
          >
            {notification.message}
          </div>
        </div>
      )}
      <div className="h-full flex flex-col">
        {token && (
          <header className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <img
                src={require("./assets/logo.png")}
                alt="logo"
                className="h-10 w-10"
              />
              <h1 className="text-2xl md:text-3xl font-bold">
                PDF TO AUDIO CONVERTER
              </h1>
            </div>

            <button
              onClick={handleLogout}
              className="bg-red-500 px-4 py-2 rounded"
            >
              Logout
            </button>
          </header>
        )}

        <main className={token ? "flex-1 min-h-0 overflow-hidden p-4 md:p-6" : "flex-1 min-h-0 overflow-hidden"}>
          {!token ? (
            <div className="h-full grid md:grid-cols-2 overflow-hidden">
              <div className="flex flex-col bg-white text-black h-full overflow-hidden">
                <div className="flex items-center gap-3 shrink-0 px-6 py-6 border-b border-gray-200">
                  <img
                    src={require("./assets/logo.png")}
                    alt="logo"
                    className="h-12 w-12"
                  />
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                    PDF TO AUDIO CONVERTER
                  </h1>
                </div>

                <div className="flex-1 flex items-center justify-center px-6 py-8 md:px-10 md:py-10 overflow-y-auto">
                  <div className="w-full max-w-sm">
                  <h2 className="text-3xl font-bold mb-2">
                    {isLogin ? "Login" : "Sign Up"}
                  </h2>

                  <p className="text-gray-500 mb-6">
                    {isLogin ? "Login to convert" : "Create new account"}
                  </p>

                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full mb-3 p-3 border rounded"
                  />

                  {isLogin ? (
                    <div className="relative mb-4">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-3 border rounded pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-gray-600 hover:text-gray-800 text-lg"
                      >
                        {showPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="relative mb-3">
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="Create Password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full p-3 border rounded pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 text-gray-600 hover:text-gray-800 text-lg"
                        >
                          {showPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
                        </button>
                      </div>

                      <div className="relative mb-4">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm Password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full p-3 border rounded pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-3 text-gray-600 hover:text-gray-800 text-lg"
                        >
                          {showConfirmPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
                        </button>
                      </div>
                    </>
                  )}

                  <button
                    onClick={isLogin ? handleLogin : handleSignup}
                    className="w-full bg-blue-500 text-white p-3 rounded mb-4"
                  >
                    {isLogin ? "Login" : "Sign Up"}
                  </button>

                  <p className="text-sm text-center">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}
                    <span
                      onClick={() => {
                        setIsLogin(!isLogin);
                        setPassword("");
                        setConfirmPassword("");
                      }}
                      className="text-blue-500 cursor-pointer ml-2"
                    >
                      {isLogin ? "Sign up" : "Login"}
                    </span>
                  </p>
                  </div>
                </div>
              </div>

              <div className="hidden md:block h-full overflow-hidden">
                <img
                  src={require("./assets/loging.png")}
                  alt="auth"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          ) : (
            <div className="h-full grid lg:grid-cols-[1.05fr_0.95fr] gap-4 min-h-0">
              <section className="bg-gray-800 rounded-3xl p-6 md:p-8 flex flex-col min-h-0 overflow-hidden">
                <div className="space-y-4">
                  <div
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-500 p-8 rounded-xl cursor-pointer hover:bg-gray-700 text-center"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,application/pdf"
                      className="hidden"
                      onChange={handleFileInputChange}
                    />

                    <div className="flex flex-col items-center gap-2">
                      <FiUploadCloud className="text-4xl text-blue-400" />
                      <p className="font-medium">Upload or Drag and Drop</p>
                      <p className="text-sm text-gray-300">PDF only</p>
                      {file && <p className="text-sm text-green-400">{file.name}</p>}
                    </div>
                  </div>

                  <select
                    value={voice}
                    onChange={(e) => setVoice(e.target.value)}
                    className="w-full p-3 bg-gray-700 rounded"
                  >
                    <option value="female">Female Voice</option>
                    <option value="male">Male Voice</option>
                  </select>

                  <input
                    type="range"
                    min="0.75"
                    max="1.5"
                    step="0.25"
                    value={speed}
                    onChange={(e) => setSpeed(parseFloat(e.target.value))}
                    className="w-full"
                  />

                  <p className="text-sm">Speed: {speed}x</p>

                  <button
                    onClick={uploadFile}
                    disabled={loading}
                    className="bg-blue-500 px-6 py-3 rounded-lg w-full disabled:bg-gray-500"
                  >
                    Convert
                  </button>

                  {loading && (
                    <div>
                      <div className="w-full bg-gray-700 rounded">
                        <div
                          className="bg-green-500 p-1 text-center text-sm rounded"
                          style={{ width: `${progress}%` }}
                        >
                          {progress}%
                        </div>
                      </div>
                    </div>
                  )}

                  {audioUrl && (
                    <div className="pt-2">
                      <audio controls src={audioUrl} className="w-full"></audio>
                      <a
                        href={audioUrl}
                        download
                        className="text-blue-400 underline mt-2 block"
                      >
                        Download Audio
                      </a>
                    </div>
                  )}
                </div>
              </section>

              <section className="bg-gray-800 rounded-3xl p-6 md:p-8 min-h-0 overflow-hidden flex flex-col">
                <h2 className="text-xl font-semibold mb-4 shrink-0">
                  Conversion History
                </h2>

                <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-3">
                  {files.length === 0 && (
                    <p className="text-gray-400">No files yet</p>
                  )}

                  {files.map((f) => (
                    <div
                      key={f.id}
                      className="bg-gray-700 p-3 rounded shadow"
                    >
                      <p className="font-medium">{f.filename}</p>

                      <p className="text-sm text-gray-300">
                        {f.status === "done" ? "Completed" : "Processing"}
                      </p>

                      {f.status === "done" && (
                        <a
                          href={`http://localhost:8000/audio/${f.id}`}
                          className="text-blue-400 text-sm"
                        >
                          Download Audio
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;