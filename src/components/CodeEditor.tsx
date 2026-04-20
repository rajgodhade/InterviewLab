'use client';

import React from 'react';
import Editor from '@monaco-editor/react';

interface CodeEditorProps {
  value: string;
  onChange: (value: string | undefined) => void;
  language?: string;
  height?: string;
  theme?: string;
  options?: any;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ 
  value, 
  onChange, 
  language = 'javascript', 
  height = '400px',
  theme = 'vs-dark',
  options = {}
}) => {
  return (
    <div style={{ 
      borderRadius: '8px', 
      overflow: 'hidden', 
      border: '1px solid var(--border-color)',
      background: '#1e1e1e' // Match Monaco vs-dark background
    }}>
      <Editor
        height={height}
        language={language}
        theme={theme}
        value={value}
        onChange={onChange}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          wordWrap: 'on',
          automaticLayout: true,
          scrollBeyondLastLine: false,
          padding: { top: 16, bottom: 16 },
          ...options
        }}
        loading={<div style={{ padding: '2rem', color: 'var(--text-secondary)', textAlign: 'center' }}>Initializing Code Editor...</div>}
      />
    </div>
  );
};

export default CodeEditor;
