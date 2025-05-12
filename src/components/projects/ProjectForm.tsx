import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { cn } from "@/lib/utils";
import { generateProjectEmbeddings } from '@/utils/embeddings/projectEmbeddings';
import { toast } from 'sonner';

interface ProjectFormData {
  name: string;
  description: string;
  scope: string;
  objective: string;
  user_role: string;
  business_area: string[];
  key_terms: string[];
  meeting_types: string[];
  is_template: boolean;
}

export function ProjectForm() {
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    description: '',
    scope: '',
    objective: '',
    user_role: '',
    business_area: [],
    key_terms: [],
    meeting_types: [],
    is_template: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const { session } = useAuth();

  const businessAreaOptions = [
    "Sales",
    "Marketing",
    "Engineering",
    "Product",
    "Design",
    "Finance",
    "HR",
    "Operations",
    "Customer Support",
  ];

  const meetingTypeOptions = [
    "Sprint Planning",
    "Daily Standup",
    "Retrospective",
    "Brainstorming",
    "Client Presentation",
    "Team Building",
    "Training Session",
    "Performance Review",
  ];

  useEffect(() => {
    if (!session) {
      setError('Not authenticated');
      setLoading(false);
      return;
    }

    if (projectId) {
      fetchProjectData(projectId);
    } else {
      setLoading(false);
    }
  }, [projectId, session]);

  const fetchProjectData = async (projectId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) {
        throw new Error(`Failed to fetch project: ${error.message}`);
      }

      if (data) {
        setFormData({
          name: data.name || '',
          description: data.description || '',
          scope: data.scope || '',
          objective: data.objective || '',
          user_role: data.user_role || '',
          business_area: data.business_area || [],
          key_terms: data.key_terms || [],
          meeting_types: data.meeting_types || [],
          is_template: data.is_template || false,
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, is_template: checked }));
  };

  const handleArrayChange = (name: string, value: string) => {
    setFormData(prev => {
      if (prev[name] && Array.isArray(prev[name])) {
        if (prev[name].includes(value)) {
          return { ...prev, [name]: prev[name].filter(item => item !== value) };
        } else {
          return { ...prev, [name]: [...prev[name], value] };
        }
      } else {
        return { ...prev, [name]: [value] };
      }
    });
  };

  const saveProject = async (data: ProjectFormData) => {
    setIsSaving(true);
    
    try {
      if (!session?.user) {
        throw new Error("Not authenticated");
      }

      const projectData = {
        ...data,
        user_id: session.user.id,
      };

      let projectIdToUse = projectId;
      let operation = 'insert';

      if (projectId) {
        operation = 'update';
      }

      const { data: project, error } = await supabase
        .from('projects')
        [operation === 'insert' ? 'insert' : 'update'](operation === 'insert' ? [projectData] : projectData)
        .eq(operation === 'update' ? 'id' : undefined, projectId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to ${operation} project: ${error.message}`);
      }

      if (!project) {
        throw new Error(`Failed to ${operation} project: No data returned`);
      }

      projectIdToUse = project.id;

      if (projectIdToUse) {
        generateProjectEmbeddings(projectIdToUse).catch(error => {
          console.error('Error generating project embeddings:', error);
        });
      }
      
      toast({
        title: "Project Saved",
        description: "Your project has been successfully saved.",
      });
      navigate('/app');
      
    } catch (error: any) {
      setError(error.message || 'Failed to save project');
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || 'Failed to save project',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const deleteProject = async () => {
    setIsDeleting(true);
    try {
      if (!projectId) {
        throw new Error("Project ID is missing");
      }

      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) {
        throw new Error(`Failed to delete project: ${error.message}`);
      }

      toast({
        title: "Project Deleted",
        description: "Your project has been successfully deleted.",
      });
      navigate('/app');
    } catch (err: any) {
      setError(err.message || 'Failed to delete project');
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || 'Failed to delete project',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    saveProject(formData);
  };

  if (loading) {
    return <div className="text-center">Loading project details...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">Error: {error}</div>;
  }

  return (
    <div className="container py-8 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>{projectId ? 'Edit Project' : 'Create New Project'}</CardTitle>
          <CardDescription>
            {projectId ? 'Update the details of your project.' : 'Fill in the details to create a new project.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="scope">Scope</Label>
            <Textarea
              id="scope"
              name="scope"
              value={formData.scope}
              onChange={handleChange}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="objective">Objective</Label>
            <Textarea
              id="objective"
              name="objective"
              value={formData.objective}
              onChange={handleChange}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="user_role">Your Role</Label>
            <Input
              type="text"
              id="user_role"
              name="user_role"
              value={formData.user_role}
              onChange={handleChange}
            />
          </div>

          <div className="grid gap-2">
            <Label>Business Areas</Label>
            <div className="flex flex-wrap gap-2">
              {businessAreaOptions.map(area => (
                <div key={area} className="space-x-2">
                  <Checkbox
                    id={`business-area-${area}`}
                    name="business_area"
                    value={area}
                    checked={formData.business_area.includes(area)}
                    onCheckedChange={() => handleArrayChange('business_area', area)}
                  />
                  <Label htmlFor={`business-area-${area}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed">
                    {area}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Key Terms</Label>
            <div className="flex flex-wrap gap-2">
              {['term1', 'term2', 'term3', 'term4', 'term5'].map(term => (
                <div key={term} className="space-x-2">
                  <Checkbox
                    id={`key-term-${term}`}
                    name="key_terms"
                    value={term}
                    checked={formData.key_terms.includes(term)}
                    onCheckedChange={() => handleArrayChange('key_terms', term)}
                  />
                  <Label htmlFor={`key-term-${term}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed">
                    {term}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Meeting Types</Label>
            <div className="flex flex-wrap gap-2">
              {meetingTypeOptions.map(type => (
                <div key={type} className="space-x-2">
                  <Checkbox
                    id={`meeting-type-${type}`}
                    name="meeting_types"
                    value={type}
                    checked={formData.meeting_types.includes(type)}
                    onCheckedChange={() => handleArrayChange('meeting_types', type)}
                  />
                  <Label htmlFor={`meeting-type-${type}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed">
                    {type}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="is_template" className="flex items-center space-x-2">
              <Checkbox
                id="is_template"
                checked={formData.is_template}
                onCheckedChange={handleCheckboxChange}
              />
              <span className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed">
                Is Template
              </span>
            </Label>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="default" className="bg-blue-500 text-white" onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
          {projectId && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isDeleting}>
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your project from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={deleteProject} disabled={isDeleting}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
