
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

// Validation schema for project creation
const projectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
  scope: z.string().optional(),
  objective: z.string().optional(),
  user_role: z.string().optional(),
});

// Business areas options
const businessAreas = [
  "Supply Chain",
  "Finance",
  "Marketing",
  "IT",
  "HR",
  "Sales",
  "Operations",
  "R&D",
  "Legal",
  "Customer Service",
];

// Meeting types options
const meetingTypes = [
  "Daily Stand-up",
  "Status Report",
  "Requirements Gathering",
  "Architecture Design",
  "Issue Triage",
  "Planning",
  "Retrospective",
  "Demo",
  "Technical Discussion",
  "Client Meeting",
];

// User roles options
const userRoles = [
  "Data Architect",
  "BI Analyst",
  "Product Owner",
  "Project Manager",
  "Developer",
  "Tester",
  "Business Analyst",
  "Team Lead",
  "Stakeholder",
  "Consultant",
];

const CreateProjectPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [keyTerms, setKeyTerms] = useState<string[]>([]);
  const [keyTermInput, setKeyTermInput] = useState("");
  const [selectedBusinessAreas, setSelectedBusinessAreas] = useState<string[]>([]);
  const [selectedMeetingTypes, setSelectedMeetingTypes] = useState<string[]>([]);

  const form = useForm<z.infer<typeof projectSchema>>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      description: "",
      scope: "",
      objective: "",
      user_role: "",
    },
  });

  const handleSubmit = async (values: z.infer<typeof projectSchema>) => {
    if (!session?.user?.id) {
      toast({
        title: "Authentication error",
        description: "You must be logged in to create a project.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const projectData = {
        ...values,
        user_id: session.user.id,
        business_area: selectedBusinessAreas,
        key_terms: keyTerms,
        meeting_types: selectedMeetingTypes,
      };

      const { data, error } = await supabase
        .from("projects")
        .insert(projectData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Project created",
        description: "Your project has been successfully created.",
      });

      navigate(`/app/project/${data.id}`);
    } catch (error) {
      console.error("Error creating project:", error);
      toast({
        title: "Error creating project",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addKeyTerm = () => {
    if (keyTermInput.trim() && !keyTerms.includes(keyTermInput.trim())) {
      setKeyTerms([...keyTerms, keyTermInput.trim()]);
      setKeyTermInput("");
    }
  };

  const removeKeyTerm = (term: string) => {
    setKeyTerms(keyTerms.filter((t) => t !== term));
  };

  const toggleBusinessArea = (area: string) => {
    if (selectedBusinessAreas.includes(area)) {
      setSelectedBusinessAreas(selectedBusinessAreas.filter((a) => a !== area));
    } else {
      setSelectedBusinessAreas([...selectedBusinessAreas, area]);
    }
  };

  const toggleMeetingType = (type: string) => {
    if (selectedMeetingTypes.includes(type)) {
      setSelectedMeetingTypes(selectedMeetingTypes.filter((t) => t !== type));
    } else {
      setSelectedMeetingTypes([...selectedMeetingTypes, type]);
    }
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-gray-50">
        <AppSidebar activePage="notes" />
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Create New Project</h1>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-6 bg-white p-6 rounded-lg shadow-sm"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Nestlé Data Governance" {...field} />
                      </FormControl>
                      <FormDescription>
                        A unique identifier for your project
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="scope"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Scope</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g. Development of gold layer data model"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Define what's included and excluded from the project scope
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="objective"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Objective</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g. Improve data quality and governance for Nestlé LATAM"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        What value or outcome does this project deliver?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <FormLabel>Business Areas</FormLabel>
                  <div className="mt-2 mb-1">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-2">
                      {businessAreas.map((area) => (
                        <Button
                          key={area}
                          type="button"
                          variant={selectedBusinessAreas.includes(area) ? "default" : "outline"}
                          onClick={() => toggleBusinessArea(area)}
                          className="h-auto py-1 justify-start text-left"
                        >
                          {area}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <FormDescription>
                    Select business areas relevant to this project
                  </FormDescription>
                </div>

                <div>
                  <FormLabel>Key Terms</FormLabel>
                  <div className="flex items-center mb-2 gap-2">
                    <Input
                      value={keyTermInput}
                      onChange={(e) => setKeyTermInput(e.target.value)}
                      placeholder="e.g. ETL, Data Vault, Power BI"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addKeyTerm();
                        }
                      }}
                    />
                    <Button type="button" onClick={addKeyTerm} className="flex-shrink-0">
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {keyTerms.map((term) => (
                      <Badge key={term} variant="secondary" className="text-sm py-1">
                        {term}
                        <button
                          type="button"
                          className="ml-1"
                          onClick={() => removeKeyTerm(term)}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <FormDescription>
                    Words that frequently appear in project meetings
                  </FormDescription>
                </div>

                <FormField
                  control={form.control}
                  name="user_role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Role</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your role in the project" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {userRoles.map((role) => (
                            <SelectItem key={role} value={role}>
                              {role}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Helps AI understand your perspective in meetings
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <FormLabel>Meeting Types</FormLabel>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                    {meetingTypes.map((type) => (
                      <Button
                        key={type}
                        type="button"
                        variant={selectedMeetingTypes.includes(type) ? "default" : "outline"}
                        onClick={() => toggleMeetingType(type)}
                        className="h-auto py-1 justify-start text-left"
                      >
                        {type}
                      </Button>
                    ))}
                  </div>
                  <FormDescription className="mt-2">
                    Types of meetings related to this project
                  </FormDescription>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
                    {isSubmitting ? "Creating Project..." : "Create Project"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(-1)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default CreateProjectPage;
