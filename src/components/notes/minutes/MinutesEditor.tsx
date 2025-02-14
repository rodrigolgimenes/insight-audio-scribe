
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
    className={`${isActive ? 'bg-muted' : ''} h-8 flex items-center gap-1`}
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
          HTMLAttributes: {
            class: 'list-disc ml-4 space-y-2',
          },
        },
        orderedList: {
          HTMLAttributes: {
            class: 'list-decimal ml-4 space-y-2',
          },
        },
        heading: {
          levels: [1, 2, 3],
          HTMLAttributes: {
            class: 'font-bold',
          },
        },
        paragraph: {
          HTMLAttributes: {
            class: 'mb-4',
          },
        },
      }),
      Markdown.configure({
        html: false,
        transformPastedText: true,
        transformCopiedText: true,
      }),
    ],
    content: content || '',
    editable: !readOnly,
    onCreate: ({ editor }) => {
      // Ensure initial content is properly formatted
      if (content) {
        editor.commands.setContent(content);
      }
    },
    onUpdate: ({ editor }) => {
      try {
        if (onChange) {
          const markdown = editor.storage.markdown.getMarkdown();
          console.log('Generated markdown:', markdown);
          onChange(markdown);
        }
      } catch (error) {
        console.error('Error in onUpdate:', error);
      }
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none min-h-[200px] p-4 focus:outline-none',
      },
    },
  });

  // Update content when prop changes
  useEffect(() => {
    if (editor && content !== editor.storage.markdown.getMarkdown()) {
      console.log('Content updated:', content);
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

          <div className="flex items-center gap-2 ml-auto">
            {onCancel && (
              <MenuButton onClick={onCancel} variant="ghost">
                <X className="h-4 w-4" />
                Cancel
              </MenuButton>
            )}
            {onSave && (
              <MenuButton onClick={onSave} variant="default">
                <Save className="h-4 w-4" />
                Save
              </MenuButton>
            )}
          </div>
        </div>
      )}
      
      <div className="min-h-[200px] [&_.ProseMirror]:min-h-[200px] [&_.ProseMirror]:p-4 [&_.ProseMirror]:focus:outline-none">
        <EditorContent 
          editor={editor}
          className="[&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:my-4 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:my-3 [&_p]:my-2"
        />
      </div>
    </div>
  );
};
