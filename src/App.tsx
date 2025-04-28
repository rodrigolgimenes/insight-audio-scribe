
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import AudioRecorder from './pages/AudioRecorder';
import Index from './pages/Index';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/audio-recorder" element={<AudioRecorder />} />
      </Routes>
    </Router>
  );
}

export default App;
