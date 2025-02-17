
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Mic } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDate } from "@/utils/formatDate";
import { formatDuration } from "@/utils/formatDuration";
import { ExportDialog } from "@/components/dashboard/ExportDialog";
import { MoveDialog } from "@/components/dashboard/MoveDialog";
import { DeleteDialog } from "@/components/dashboard/DeleteDialog";
import { BulkActions } from "@/components/dashboard/BulkActions";

interface Recording {
  id: string;
  title: string;
  duration: number | null;
  created_at: string;
  status: string;
  mode?: string;
}

export default function Dashboard2() {
  const navigate = useNavigate();
  const [selectedRecordings, setSelectedRecordings] = useState<string[]>([]);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isMoveOpen, setIsMoveOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const { data: recordings = [], isLoading } = useQuery({
    queryKey: ['recordings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recordings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Recording[];
    },
  });

  const handleSelectAll = () => {
    if (selectedRecordings.length === recordings.length) {
      setSelectedRecordings([]);
    } else {
      setSelectedRecordings(recordings.map(r => r.id));
    }
  };

  const handleSelectRecording = (id: string) => {
    setSelectedRecordings(prev => {
      if (prev.includes(id)) {
        return prev.filter(r => r !== id);
      }
      return [...prev, id];
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            <div className="relative flex-1 max-w-2xl">
              <input
                type="text"
                placeholder="Search files..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border-0 focus:ring-2 focus:ring-blue-400"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            <button className="p-2 rounded-full bg-blue-500 hover:bg-blue-400 text-white">
              <Mic className="h-5 w-5" />
            </button>
          </div>
          <Button 
            onClick={() => navigate('/record')}
            className="ml-4 bg-white text-blue-600 hover:bg-blue-50"
          >
            TRANSCRIBE FILES
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-6">Recent Files</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="py-3 px-4 text-left">
                      <Checkbox 
                        checked={selectedRecordings.length === recordings.length}
                        onCheckedChange={handleSelectAll}
                      />
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">NAME</th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">UPLOAD DATE</th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">DURATION</th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">MODE</th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {recordings.map((recording) => (
                    <tr 
                      key={recording.id}
                      className="border-b hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/notes/${recording.id}`)}
                    >
                      <td className="py-3 px-4">
                        <Checkbox 
                          checked={selectedRecordings.includes(recording.id)}
                          onCheckedChange={() => handleSelectRecording(recording.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                      <td className="py-3 px-4">{recording.title}</td>
                      <td className="py-3 px-4">{formatDate(recording.created_at)}</td>
                      <td className="py-3 px-4">{formatDuration(recording.duration)}</td>
                      <td className="py-3 px-4">{recording.mode || 'Auto'}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${recording.status === 'completed' ? 'bg-green-100 text-green-800' : 
                            recording.status === 'error' ? 'bg-red-100 text-red-800' : 
                            'bg-blue-100 text-blue-800'}`}>
                          {recording.status === 'completed' ? 'Completed' : 
                           recording.status === 'error' ? 'Error' : 
                           'Processing'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedRecordings.length > 0 && (
        <BulkActions
          selectedCount={selectedRecordings.length}
          onExport={() => setIsExportOpen(true)}
          onMove={() => setIsMoveOpen(true)}
          onDelete={() => setIsDeleteOpen(true)}
        />
      )}

      {/* Dialogs */}
      <ExportDialog 
        open={isExportOpen}
        onOpenChange={setIsExportOpen}
        selectedIds={selectedRecordings}
      />
      
      <MoveDialog
        open={isMoveOpen}
        onOpenChange={setIsMoveOpen}
        selectedIds={selectedRecordings}
      />

      <DeleteDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        selectedIds={selectedRecordings}
        onDelete={() => {
          setSelectedRecordings([]);
          setIsDeleteOpen(false);
        }}
      />
    </div>
  );
}
