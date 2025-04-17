
import React from 'react';

interface AudioPlayerProps {
  audioUrl: string | null;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioUrl }) => {
  if (!audioUrl) return null;

  return (
    <div>
      <audio src={audioUrl} controls className="w-full" />
    </div>
  );
};

export default AudioPlayer;
