import React, { useState } from "react"; 
import axios from "axios"; 

function App() { 
  const [file, setFile] = useState(null); 
  const [progress, setProgress] = useState(0); 
  const [audioUrl, setAudioUrl] = useState(""); 
  const [loading, setLoading] = useState(false);

  const handleDrop = (e) => {
     e.preventDefault();
      setFile(e.dataTransfer.files[0]); };
      
      const uploadFile = async () => { 
        if (!file) return alert("Drop a PDF first");
          setLoading(true);
          setProgress(0);

        const formData = new FormData();
        formData.append("file", file); 
        
        const res = await axios.post("http://localhost:8000/upload", formData); 
        const file_id = res.data.file_id; 
        
        const ws = new WebSocket(`ws://localhost:8000/ws/${file_id}`); 
        
        ws.onmessage = (event) => { 
          const data = JSON.parse(event.data); 
          
          if (data.progress) { 
            setProgress(data.progress);
           } 
           
           if (data.done) { setAudioUrl(`http://localhost:8000${data.audio_url}`); 
            setLoading(false);

           } 
           if (data.error) {
            alert(data.error);
            setLoading(false);}
          }; 
        }; 
       return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-lg text-center">

        <h1 className="text-2xl font-bold mb-4">PDF → Audio Converter</h1>

        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-gray-300 p-10 rounded-lg mb-4 cursor-pointer hover:bg-gray-50"
        >
          {file ? file.name : "Drag & Drop your PDF here"}
        </div>

        <button
          onClick={uploadFile}
          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition"
        >
          Convert
        </button>

        {loading && (
          <div className="mt-4">
            <progress value={progress} max="100" className="w-full"></progress>
            <p className="mt-2 text-sm text-gray-600">{progress}%</p>
          </div>
        )}

        {audioUrl && (
          <div className="mt-6">
            <audio controls src={audioUrl} className="w-full"></audio>
            <a
              href={audioUrl}
              download
              className="text-blue-500 underline mt-2 block"
            >
              Download Audio
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;