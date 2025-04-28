// We'll add the AudioRecorder route to the App.tsx file
// Assuming there's already a React Router setup

import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import AudioRecorder from './pages/AudioRecorder';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/audio-recorder" element={<AudioRecorder />} />
      </Routes>
    </Router>
  );
}

export default App;
