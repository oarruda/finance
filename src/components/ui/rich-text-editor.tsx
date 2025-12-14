'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Bold, Italic, Underline, List, ListOrdered, Link as LinkIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  rows?: number;
  className?: string;
}

export function RichTextEditor({
  value,
  onChange,
  disabled = false,
  placeholder = '',
  rows = 8,
  className,
}: RichTextEditorProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const insertFormatting = (prefix: string, suffix: string, defaultText: string = '') => {
    if (!textareaRef.current || disabled) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const textToInsert = selectedText || defaultText;

    const newValue =
      value.substring(0, start) +
      prefix +
      textToInsert +
      suffix +
      value.substring(end);

    onChange(newValue);

    // Reposicionar cursor
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + prefix.length + textToInsert.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const formatButtons = [
    {
      icon: Bold,
      label: 'Negrito',
      action: () => insertFormatting('<strong>', '</strong>', 'texto em negrito'),
    },
    {
      icon: Italic,
      label: 'Itálico',
      action: () => insertFormatting('<em>', '</em>', 'texto em itálico'),
    },
    {
      icon: Underline,
      label: 'Sublinhado',
      action: () => insertFormatting('<u>', '</u>', 'texto sublinhado'),
    },
    {
      icon: List,
      label: 'Lista',
      action: () => insertFormatting('\n• ', '', 'item da lista'),
    },
    {
      icon: ListOrdered,
      label: 'Lista Numerada',
      action: () => insertFormatting('\n1. ', '', 'primeiro item'),
    },
    {
      icon: LinkIcon,
      label: 'Link',
      action: () => insertFormatting('<a href="URL">', '</a>', 'texto do link'),
    },
  ];

  const insertVariable = (variable: string) => {
    if (!textareaRef.current || disabled) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const newValue =
      value.substring(0, start) +
      variable +
      value.substring(end);

    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + variable.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const variables = [
    { label: 'Nome', value: '{nome}' },
    { label: 'Email', value: '{email}' },
    { label: 'Senha', value: '{senha}' },
    { label: 'Link', value: '{link}' },
  ];

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex flex-wrap gap-1 p-2 border rounded-t-md bg-muted/50">
        <div className="flex flex-wrap gap-1 flex-1">
          {formatButtons.map((button, index) => (
            <Button
              key={index}
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              onClick={button.action}
              className="h-8 w-8 p-0"
              title={button.label}
            >
              <button.icon className="h-4 w-4" />
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1 border-l pl-2 ml-2">
          {variables.map((variable, index) => (
            <Button
              key={index}
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={() => insertVariable(variable.value)}
              className="h-8 px-2 text-xs"
              title={`Inserir ${variable.label}`}
            >
              {variable.label}
            </Button>
          ))}
        </div>
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        rows={rows}
        className={cn(
          'flex min-h-[80px] w-full rounded-b-md border border-t-0 border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono',
        )}
      />
    </div>
  );
}
