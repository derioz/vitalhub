'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { Bold, Italic, Strikethrough, Code } from 'lucide-react';
import { useEffect } from 'react';

interface Props {
    value: string;
    onChange: (markdown: string) => void;
    placeholder?: string;
    className?: string;
}

export function MarkdownEditor({ value, onChange, placeholder, className }: Props) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Markdown,
            Image,
            Link.configure({
                openOnClick: false,
                autolink: true,
                defaultProtocol: 'https',
            })
        ],
        immediatelyRender: false,
        content: value,
        editorProps: {
            attributes: {
                class: 'prose prose-invert max-w-none focus:outline-none min-h-[150px] p-4 text-slate-200'
            }
        },
        onUpdate: ({ editor }) => {
            const markdown = (editor.storage as any).markdown.getMarkdown();
            onChange(markdown);
        },
    });

    useEffect(() => {
        if (editor && !editor.isFocused && value !== (editor.storage as any).markdown.getMarkdown()) {
            editor.commands.setContent(value);
        }
    }, [value, editor]);

    if (!editor) {
        return null;
    }

    return (
        <div className={`rounded-md border border-slate-700 bg-slate-800 focus-within:border-brand-start transition-colors overflow-hidden ${className}`}>
            {/* Toolbar */}
            <div className="flex items-center gap-1 border-b border-slate-700 bg-slate-900/50 p-2">
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={`p-1.5 rounded hover:bg-slate-700 ${editor.isActive('bold') ? 'text-brand-start' : 'text-slate-400'}`}
                    title="Bold"
                >
                    <Bold className="h-4 w-4" />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={`p-1.5 rounded hover:bg-slate-700 ${editor.isActive('italic') ? 'text-brand-start' : 'text-slate-400'}`}
                    title="Italic"
                >
                    <Italic className="h-4 w-4" />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    className={`p-1.5 rounded hover:bg-slate-700 ${editor.isActive('strike') ? 'text-brand-start' : 'text-slate-400'}`}
                    title="Strikethrough"
                >
                    <Strikethrough className="h-4 w-4" />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleCode().run()}
                    className={`p-1.5 rounded hover:bg-slate-700 ${editor.isActive('code') ? 'text-brand-start' : 'text-slate-400'}`}
                    title="Code"
                >
                    <Code className="h-4 w-4" />
                </button>
            </div>
            <EditorContent editor={editor} placeholder={placeholder} />
        </div>
    );
}
