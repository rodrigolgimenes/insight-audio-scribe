
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Markdown from 'tiptap-markdown';
import { useEffect, useCallback } from 'react';
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
  children 
}: { 
  onClick: () => void; 
  isActive?: boolean; 
  disabled?: boolean;
  children: React.ReactNode;
}) => (
  <Button
    type="button"
    variant="ghost"
    size="sm"
    onClick={onClick}
    className={`${isActive ? 'bg-muted' : ''} p-2 h-8`}
    disabled={disabled}
  >
    {children}
  </Button>
);

export const MinutesEditor = ({
  content,
  onChange,
  readOnly = false
}: MinutesEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Markdown.configure({
        html: false,
        transformPastedText: true,
        transformCopiedText: true
      })
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

  const addHeadingLevel = (level: 2 | 3) => {
    editor.chain().focus().toggleHeading({ level }).run();
  };

  return (
    <div className="border rounded-lg bg-white">
      {!readOnly && (
        <div className="border-b p-2 flex flex-wrap gap-2 bg-gray-50">
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
            onClick={() => addHeadingLevel(2)}
            isActive={editor.isActive('heading', { level: 2 })}
          >
            <Heading2 className="h-4 w-4" />
          </MenuButton>
          
          <MenuButton
            onClick={() => addHeadingLevel(3)}
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
      )}
      
      <EditorContent editor={editor} />
    </div>
  );
};
