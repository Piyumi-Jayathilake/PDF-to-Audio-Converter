import React, { useState, useEffect } from "react";
import axios from "axios";

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
  const [token, setToken] = useState(localStorage.getItem("token"));

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken("");
    setFiles([]);
    setAudioUrl("");
  };

  // Fetch user files
  const fetchFiles = async () => {
    if (!token) return;

    try {
      const res = await fetch("http://localhost:8000/files", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      setFiles(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [token]);

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
        alert("Login successful");
      } else {
        alert(res.data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Login failed");
    }
  };

  // Signup
  const handleSignup = async () => {
    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("password", password);

      const res = await axios.post("http://localhost:8000/signup", formData);

      alert(res.data.message || res.data.error);
    } catch (err) {
      console.error(err);
      alert("Signup failed");
    }
  };

  // Drag & drop
  const handleDrop = (e) => {
    e.preventDefault();
    setFile(e.dataTransfer.files[0]);
  };

  // Upload file
  const uploadFile = async () => {
    if (!file) return alert("Select a PDF first");

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
          alert(data.error);
          setLoading(false);
        }
      };
    } catch (err) {
      console.error(err);
      setLoading(false);
      alert("Upload failed");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-6">
      <div className="bg-gray-800 shadow-xl rounded-2xl p-8 w-full max-w-lg text-center">

        {/* TITLE */}
        <h1 className="text-2xl font-bold mb-4">
          PDF to Audio Converter
        </h1>

        {/* LOGOUT */}
        {token && (
          <button
            onClick={handleLogout}
            className="bg-red-500 px-4 py-2 rounded mb-4"
          >
            Logout
          </button>
        )}

        {/* LOGIN SECTION */}
        {!token && (
          <div className="mb-6">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mb-2 p-2 rounded bg-gray-700"
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mb-2 p-2 rounded bg-gray-700"
            />

            <div className="flex gap-2">
              <button
                onClick={handleLogin}
                className="bg-green-500 px-4 py-2 rounded w-full"
              >
                Login
              </button>

              <button
                onClick={handleSignup}
                className="bg-yellow-500 px-4 py-2 rounded w-full"
              >
                Signup
              </button>
            </div>
          </div>
        )}

        {/* APP CONTENT (ONLY WHEN LOGGED IN) */}
        {token && (
          <>
            {/* Drag & Drop */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-gray-500 p-10 rounded-lg mb-4 cursor-pointer hover:bg-gray-700"
            >
              {file ? file.name : "Drag & Drop your PDF here"}
            </div>

            {/* Voice */}
            <select
              value={voice}
              onChange={(e) => setVoice(e.target.value)}
              className="w-full mb-4 p-2 bg-gray-700 rounded"
            >
              <option value="female">Female Voice</option>
              <option value="male">Male Voice</option>
            </select>

            {/* Speed */}
            <input
              type="range"
              min="0.75"
              max="1.5"
              step="0.25"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="w-full mb-2"
            />

            <p className="text-sm mb-4">Speed: {speed}x</p>

            {/* Convert Button */}
            <button
              onClick={uploadFile}
              disabled={loading}
              className="bg-blue-500 px-6 py-2 rounded-lg w-full disabled:bg-gray-500"
            >
              Convert
            </button>

            {/* Progress */}
            {loading && (
              <div className="mt-4">
                <div className="w-full bg-gray-700 rounded">
                  <div
                    className="bg-green-500 p-1 text-center text-sm"
                    style={{ width: `${progress}%` }}
                  >
                    {progress}%
                  </div>
                </div>
              </div>
            )}

            {/* Audio */}
            {audioUrl && (
              <div className="mt-6">
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

            {/* History */}
            <div className="mt-8 text-left">
              <h2 className="text-xl font-semibold mb-4">
                Conversion History
              </h2>

              {files.length === 0 && (
                <p className="text-gray-400">No files yet</p>
              )}

              {files.map((f) => (
                <div
                  key={f.id}
                  className="bg-gray-700 p-3 mb-3 rounded shadow"
                >
                  <p className="font-medium">{f.filename}</p>

                  <p className="text-sm text-gray-300">
                    {f.status === "done"
                      ? "Completed"
                      : "Processing"}
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
          </>
        )}
      </div>
    </div>
  );
}

export default App;