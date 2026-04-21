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

  const fetchFiles = async () => {
 try {
    const res = await fetch("http://localhost:8000/files");
    const data = await res.json();
    setFiles(data);
  } catch (err) {
    console.error(err);
  }
};

useEffect(() => {
  fetchFiles();
}, []);

  const handleDrop = (e) => {
     e.preventDefault();
      setFile(e.dataTransfer.files[0]); };
      
      const uploadFile = async () => { 
        if (!file) return alert("Drop a PDF first");
          setLoading(true);
          setProgress(0);

        const formData = new FormData();
        formData.append("file", file); 
        formData.append("voice", voice);
        formData.append("speed", speed);
        
        const res = await axios.post("http://localhost:8000/upload", formData); 
        const file_id = res.data.file_id; 
        
        const ws = new WebSocket(`ws://localhost:8000/ws/${file_id}`); 
        
        ws.onmessage = (event) => { 
          const data = JSON.parse(event.data); 
          
          if (data.progress) { 
            setProgress(data.progress);
           } 
           
           if (data.done) { 
            setAudioUrl(`http://localhost:8000${data.audio_url}`); 
            setLoading(false);
            fetchFiles(); 

           } 
           if (data.error) {
            alert(data.error);
            setLoading(false);}
          }; 
        }; 
       return (
   <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-6">
      <div className="bg-gray-800 shadow-xl rounded-2xl p-8 w-full max-w-lg text-center">

        <h1 className="text-2xl font-bold mb-6">
          PDF to Audio Converter 
        </h1>

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

        {/* Button */}
        <button
          onClick={uploadFile}
          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition w-full"
        >
          Convert
        </button>

        {/* Progress */}
        {loading && (
          <div className="mt-4">
            <progress value={progress} max="100" className="w-full"></progress>
            <p className="mt-2 text-sm text-gray-400">{progress}%</p>
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

        {/* HISTORY SECTION */}
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
                Status:{" "}
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

      </div>
    </div>
  );
}

export default App;