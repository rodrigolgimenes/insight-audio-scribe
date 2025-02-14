
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  Undo,
  Redo,
  MinusSquare,
  Save,
  X
} from 'lucide-react';

interface MinutesEditorProps {
  content: string;
  onChange?: (content: string) => void;
  onSave?: () => void;
  onCancel?: () => void;
  readOnly?: boolean;
}

const MenuButton = ({ 
  onClick, 
  isActive = false, 
  disabled = false,
  variant = "ghost",
  children 
}: { 
  onClick: () => void; 
  isActive?: boolean; 
  disabled?: boolean;
  variant?: "ghost" | "default" | "destructive";
  children: React.ReactNode;
}) => (
  <Button
    type="button"
    variant={variant}
    size="sm"
    onClick={onClick}
    className={`${isActive ? 'bg-muted' : ''} h-8`}
    disabled={disabled}
  >
    {children}
  </Button>
);

export const MinutesEditor = ({
  content,
  onChange,
  onSave,
  onCancel,
  readOnly = false
}: MinutesEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Markdown.configure({
        html: false,
        transformPastedText: true,
        transformCopiedText: true,
      }),
    ],
    content,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      const markdown = editor.storage.markdown.getMarkdown();
      onChange?.(markdown);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-blue max-w-none min-h-[200px] p-4 border rounded-lg focus:outline-none'
      }
    }
  });

  useEffect(() => {
    if (editor && content !== editor.storage.markdown.getMarkdown()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) return null;

  return (
    <div className="border rounded-lg bg-white">
      {!readOnly && (
        <div className="border-b p-2 flex flex-wrap items-center gap-2 bg-gray-50">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <MenuButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              isActive={editor.isActive('bold')}
            >
              <Bold className="h-4 w-4" />
            </MenuButton>
            
            <MenuButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              isActive={editor.isActive('italic')}
            >
              <Italic className="h-4 w-4" />
            </MenuButton>
            
            <MenuButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              isActive={editor.isActive('bulletList')}
            >
              <List className="h-4 w-4" />
            </MenuButton>
            
            <MenuButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              isActive={editor.isActive('orderedList')}
            >
              <ListOrdered className="h-4 w-4" />
            </MenuButton>
            
            <MenuButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              isActive={editor.isActive('heading', { level: 2 })}
            >
              <Heading2 className="h-4 w-4" />
            </MenuButton>
            
            <MenuButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              isActive={editor.isActive('heading', { level: 3 })}
            >
              <Heading3 className="h-4 w-4" />
            </MenuButton>
            
            <MenuButton
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
            >
              <MinusSquare className="h-4 w-4" />
            </MenuButton>
            
            <MenuButton
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
            >
              <Undo className="h-4 w-4" />
            </MenuButton>
            
            <MenuButton
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
            >
              <Redo className="h-4 w-4" />
            </MenuButton>
          </div>

          <div className="flex items-center gap-2">
            {onCancel && (
              <MenuButton onClick={onCancel} variant="ghost">
                <X className="h-4 w-4 mr-1" />
                Cancel
              </MenuButton>
            )}
            {onSave && (
              <MenuButton onClick={onSave} variant="default">
                <Save className="h-4 w-4 mr-1" />
                Save
              </MenuButton>
            )}
          </div>
        </div>
      )}
      
      <EditorContent editor={editor} />
    </div>
  );
};
