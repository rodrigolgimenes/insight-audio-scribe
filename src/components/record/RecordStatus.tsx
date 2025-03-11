
interface RecordStatusProps {
  isRecording: boolean;
  isPaused: boolean;
}

export const RecordStatus = ({ isRecording, isPaused }: RecordStatusProps) => {
  return (
    <div className="mb-8">
      <span className="inline-flex items-center text-gray-600">
        <span className={`w-2 h-2 rounded-full mr-2 ${isRecording && !isPaused ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`}></span>
        {isRecording ? (isPaused ? 'Paused' : 'Recording...') : 'Recording off'}
      </span>
    </div>
  );
};
