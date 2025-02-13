
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Copy,
  Heading1,
  Heading2,
  Undo,
  Redo,
  Save,
  X,
} from 'lucide-react';

interface MinutesEditorProps {
  content: string;
  onChange?: (content: string) => void;
  onSave?: () => void;
  onCancel?: () => void;
  readOnly?: boolean;
}

export const MinutesEditor = ({ 
  content, 
  onChange, 
  onSave, 
  onCancel, 
  readOnly = false 
}: MinutesEditorProps) => {
  const { toast } = useToast();
  
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const copyContent = async () => {
    if (!editor) return;
    
    try {
      await navigator.clipboard.writeText(editor.getHTML());
      toast({
        title: "Success",
        description: "Meeting minutes copied to clipboard",
      });
    } catch (error) {
      console.error('Failed to copy content:', error);
      toast({
        title: "Error",
        description: "Failed to copy meeting minutes",
        variant: "destructive",
      });
    }
  };

  if (!editor) return null;

  return (
    <div className="border rounded-lg bg-white">
      {!readOnly && (
        <div className="border-b p-2 flex flex-wrap gap-2 bg-gray-50">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive('bold') ? 'bg-gray-200' : ''}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive('italic') ? 'bg-gray-200' : ''}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={editor.isActive('bulletList') ? 'bg-gray-200' : ''}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={editor.isActive('orderedList') ? 'bg-gray-200' : ''}
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={editor.isActive('heading', { level: 1 }) ? 'bg-gray-200' : ''}
          >
            <Heading1 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={editor.isActive('heading', { level: 2 }) ? 'bg-gray-200' : ''}
          >
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().undo().run()}
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().redo().run()}
          >
            <Redo className="h-4 w-4" />
          </Button>
          <div className="flex-1" />
          <Button
            variant="outline"
            size="sm"
            onClick={copyContent}
            className="gap-2"
          >
            <Copy className="h-4 w-4" />
            Copy All
          </Button>
          {onSave && onCancel && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={onCancel}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={onSave}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            </>
          )}
        </div>
      )}
      <EditorContent 
        editor={editor} 
        className="prose prose-sm md:prose-base lg:prose-lg max-w-none p-4"
      />
    </div>
  );
};
