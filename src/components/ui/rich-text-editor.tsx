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
  additionalVariables?: Array<{ label: string; value: string }>;
}

export function RichTextEditor({
  value,
  onChange,
  disabled = false,
  placeholder = '',
  rows = 8,
  className,
  additionalVariables = [],
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

  const defaultVariables = [
    { label: 'Nome', value: '{nome}' },
    { label: 'Email', value: '{email}' },
    { label: 'Senha', value: '{senha}' },
    { label: 'Link', value: '{link}' },
  ];

  const variables = [...defaultVariables, ...additionalVariables];

  // Preview HTML com substituição de variáveis de exemplo
  let previewHTML = value
    .replace(/{nome}/g, '<strong>João Silva</strong>')
    .replace(/{email}/g, '<strong>joao.silva@exemplo.com</strong>')
    .replace(/{senha}/g, '<strong style="color: #667eea; background: #f8f9fa; padding: 4px 8px; border-radius: 4px; font-family: monospace;">Temp@2024Pass</strong>')
    .replace(/{link}/g, '#')
    .replace(/{periodo}/g, '<strong>01/12/2024 a 31/12/2024</strong>')
    .replace(/{totalReceitas}/g, '<strong style="color: #2e7d32;">R$ 5.000,00</strong>')
    .replace(/{totalDespesas}/g, '<strong style="color: #c62828;">R$ 3.100,00</strong>')
    .replace(/{saldo}/g, '<strong style="color: #1565c0;">R$ 1.900,00</strong>')
    .replace(/{totalTransacoes}/g, '<strong>45</strong>')
    .replace(/{topCategorias}/g, '<br><strong>1. Alimentação - R$ 1.200,00</strong><br><strong>2. Transporte - R$ 800,00</strong><br><strong>3. Lazer - R$ 450,00</strong>')
    .replace(/{totalConversoes}/g, '<strong>12</strong>')
    .replace(/{valorTotalConvertido}/g, '<strong>€ 2.450,00</strong>')
    .replace(/{taxaMediaConversao}/g, '<strong>5.25</strong>')
    .replace(/{topMoedasConversao}/g, '<br><strong>1. BRL → EUR: € 1.500,00</strong><br><strong>2. BRL → USD: $ 950,00</strong>')
    .replace(/\n/g, '<br>');

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
          <span className="text-xs text-muted-foreground px-2 flex items-center">Variáveis:</span>
          {variables.map((variable, index) => (
            <Button
              key={index}
              type="button"
              variant="secondary"
              size="sm"
              disabled={disabled}
              onClick={() => insertVariable(variable.value)}
              className="h-8 px-3 text-xs font-medium"
              title={`Inserir ${variable.label}`}
            >
              {variable.label}
            </Button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Código</label>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            placeholder={placeholder}
            rows={rows}
            className={cn(
              'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono',
            )}
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Preview</label>
          <div 
            className={cn(
              'min-h-[80px] w-full rounded-md border border-input bg-white px-4 py-3 text-sm overflow-auto',
            )}
            style={{ 
              height: `${rows * 24}px`,
              lineHeight: '1.6',
              fontFamily: 'Arial, sans-serif'
            }}
            dangerouslySetInnerHTML={{ __html: previewHTML }}
          />
        </div>
      </div>
    </div>
  );
}
