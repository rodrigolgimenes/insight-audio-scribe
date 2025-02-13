
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { User2, Save } from 'lucide-react';

interface MeetingPersonaData {
  primary_role: string;
  custom_role: string | null;
  focus_areas: string[];
  custom_vocabulary: string[];
}

const predefinedRoles = [
  'Data Architect',
  'Data Engineer',
  'Machine Learning Engineer',
  'Business Analyst',
  'Product Manager',
  'Software Engineer',
  'Executive',
  'Custom'
];

const focusAreas = [
  { id: 'technical', label: 'Technical Deep Dive', description: 'Databases, cloud, infrastructure' },
  { id: 'analytics', label: 'Analytics & BI', description: 'KPIs, dashboards, data storytelling' },
  { id: 'ai', label: 'AI & Machine Learning', description: 'ML models, automation' },
  { id: 'governance', label: 'Project & Governance', description: 'Data governance, compliance' },
  { id: 'strategy', label: 'Business Strategy', description: 'ROI, business impact' }
];

export const MeetingPersonaSection = () => {
  const { session } = useAuth();
  const { toast } = useToast();
  const [customRole, setCustomRole] = useState('');
  const [selectedRole, setSelectedRole] = useState('Software Engineer');
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [vocabulary, setVocabulary] = useState('');

  const { data: personaData, isLoading } = useQuery({
    queryKey: ['meetingPersona'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meeting_personas')
        .select('*')
        .eq('user_id', session?.user?.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!session?.user?.id,
  });

  useEffect(() => {
    if (personaData) {
      setSelectedRole(personaData.primary_role);
      setCustomRole(personaData.custom_role || '');
      setSelectedAreas(personaData.focus_areas || []);
      setVocabulary((personaData.custom_vocabulary || []).join(', '));
    }
  }, [personaData]);

  const updatePersona = useMutation({
    mutationFn: async (data: MeetingPersonaData) => {
      const { error } = await supabase
        .from('meeting_personas')
        .upsert({
          user_id: session?.user?.id,
          ...data,
          custom_vocabulary: vocabulary.split(',').map(word => word.trim()).filter(Boolean)
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Your meeting persona has been updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update meeting persona. Please try again.",
        variant: "destructive",
      });
      console.error('Error updating meeting persona:', error);
    },
  });

  const handleSave = () => {
    updatePersona.mutate({
      primary_role: selectedRole,
      custom_role: selectedRole === 'Custom' ? customRole : null,
      focus_areas: selectedAreas,
      custom_vocabulary: vocabulary.split(',').map(word => word.trim()).filter(Boolean)
    });
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <User2 className="w-5 h-5" />
        <h2 className="text-xl font-semibold">Meeting Persona</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Customize meeting summaries based on your role and expertise.
      </p>
      <Separator />

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="role">Primary Role</Label>
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger>
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              {predefinedRoles.map((role) => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedRole === 'Custom' && (
          <div className="space-y-2">
            <Label htmlFor="customRole">Custom Role Name</Label>
            <Input
              id="customRole"
              placeholder="Enter your role"
              value={customRole}
              onChange={(e) => setCustomRole(e.target.value)}
            />
          </div>
        )}

        <div className="space-y-4">
          <Label>Areas of Focus</Label>
          <div className="grid gap-4">
            {focusAreas.map((area) => (
              <div key={area.id} className="flex items-start space-x-2">
                <Checkbox
                  id={area.id}
                  checked={selectedAreas.includes(area.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedAreas([...selectedAreas, area.id]);
                    } else {
                      setSelectedAreas(selectedAreas.filter(id => id !== area.id));
                    }
                  }}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor={area.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {area.label}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {area.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="vocabulary">Custom Vocabulary</Label>
          <Input
            id="vocabulary"
            placeholder="Enter technical terms, separated by commas"
            value={vocabulary}
            onChange={(e) => setVocabulary(e.target.value)}
          />
          <p className="text-sm text-muted-foreground">
            Add specific jargon and technical terms that should be used in your meeting summaries.
          </p>
        </div>

        <Button 
          onClick={handleSave}
          className="w-full md:w-auto"
          disabled={updatePersona.isPending}
        >
          <Save className="w-4 h-4 mr-2" />
          Save Persona
        </Button>
      </div>
    </div>
  );
};
