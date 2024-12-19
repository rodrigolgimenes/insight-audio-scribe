import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit2 } from "lucide-react";

interface Style {
  id: string;
  name: string;
  description: string;
  prompt_template: string;
  category: string;
}

interface StyleCardProps {
  style: Style;
  onEdit: () => void;
}

export function StyleCard({ style, onEdit }: StyleCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium">{style.name}</CardTitle>
        <Button variant="ghost" size="icon" onClick={onEdit}>
          <Edit2 className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <CardDescription>{style.description}</CardDescription>
        <div className="mt-4">
          <div className="text-sm text-gray-500">Category</div>
          <div className="text-sm">{style.category || "Uncategorized"}</div>
        </div>
      </CardContent>
    </Card>
  );
}