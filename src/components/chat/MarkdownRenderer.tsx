// components/MarkdownRenderer.tsx
// Install: npm install react-markdown remark-gfm react-syntax-highlighter
// Types: npm install -D @types/react-syntax-highlighter

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MarkdownRendererProps {
    content: string;
    className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({content, className = ''}) => {
    // Pre-process content to fix common formatting issues
    const processedContent = content
        // Remove empty bullet points (bullet followed by newline with no content)
        .replace(/^[\s]*[-*•][\s]*$/gm, '')
        // Fix bullet points separated from content by newline
        .replace(/^([-*•])[\s]*\n+[\s]*(\*\*)/gm, '$1 $2')
        // Remove multiple consecutive empty lines
        .replace(/\n{3,}/g, '\n\n')
        .trim();

    return (
        <div className={`markdown-content prose prose-sm max-w-none ${className}`}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    // Headings
                    h1: ({children}) => (
                        <h1 className="text-xl font-bold text-gray-900 mt-4 mb-2 first:mt-0">
                            {children}
                        </h1>
                    ),
                    h2: ({children}) => (
                        <h2 className="text-lg font-bold text-gray-800 mt-4 mb-2 first:mt-0">
                            {children}
                        </h2>
                    ),
                    h3: ({children}) => (
                        <h3 className="text-base font-semibold text-gray-800 mt-3 mb-1 first:mt-0">
                            {children}
                        </h3>
                    ),

                    // Paragraphs
                    p: ({children}) => {
                        // Check if paragraph is empty or only whitespace
                        const isEmpty = !children ||
                            (typeof children === 'string' && !children.trim()) ||
                            (Array.isArray(children) && children.every(c => !c || (typeof c === 'string' && !c.trim())));

                        if (isEmpty) return null;

                        return (
                            <p className="text-sm text-gray-700 leading-relaxed mb-2 last:mb-0">
                                {children}
                            </p>
                        );
                    },

                    // Bold
                    strong: ({children}) => (
                        <strong className="font-semibold text-gray-900">{children}</strong>
                    ),

                    // Italic
                    em: ({children}) => (
                        <em className="italic text-gray-800">{children}</em>
                    ),

                    // Lists
                    ul: ({children}) => (
                        <ul className="space-y-1 mb-3 ml-4 list-disc">
                            {children}
                        </ul>
                    ),
                    ol: ({children}) => (
                        <ol className="space-y-1 mb-3 ml-4 list-decimal">
                            {children}
                        </ol>
                    ),
                    li: ({children}) => {
                        // Check if list item is empty
                        const isEmpty = !children ||
                            (typeof children === 'string' && !children.trim()) ||
                            (Array.isArray(children) && children.every(c => !c || (typeof c === 'string' && !c.trim())));

                        if (isEmpty) return null;

                        return (
                            <li className="text-sm text-gray-700 pl-1">{children}</li>
                        );
                    },

                    // Code blocks
                    code: ({node, inline, className, children, ...props}: any) => {
                        const match = /language-(\w+)/.exec(className || '');
                        const language = match ? match[1] : '';
                        const codeString = String(children).replace(/\n$/, '');

                        // Code block (not inline)
                        if (!inline && (language || codeString.includes('\n'))) {
                            return (
                                <div className="my-3 rounded-lg overflow-hidden">
                                    {language && (
                                        <div
                                            className="bg-gray-800 px-4 py-1.5 text-xs text-gray-400 font-mono flex items-center justify-between">
                                            <span>{language}</span>
                                            <button
                                                onClick={() => navigator.clipboard.writeText(codeString)}
                                                className="text-gray-400 hover:text-white transition-colors text-xs"
                                            >
                                                Copy
                                            </button>
                                        </div>
                                    )}
                                    <SyntaxHighlighter
                                        style={oneDark}
                                        language={language || 'text'}
                                        PreTag="div"
                                        customStyle={{
                                            margin: 0,
                                            borderRadius: language ? 0 : '8px',
                                            fontSize: '12px',
                                            padding: '12px 16px',
                                        }}
                                        {...props}
                                    >
                                        {codeString}
                                    </SyntaxHighlighter>
                                </div>
                            );
                        }

                        // Inline code
                        return (
                            <code className="bg-gray-200 text-pink-600 px-1.5 py-0.5 rounded text-xs font-mono">
                                {children}
                            </code>
                        );
                    },

                    // Pre tag (for code blocks without language)
                    pre: ({children}) => <>{children}</>,

                    // Blockquote
                    blockquote: ({children}) => (
                        <blockquote className="border-l-4 border-blue-500 pl-3 py-1 my-2 bg-blue-50 rounded-r text-sm">
                            {children}
                        </blockquote>
                    ),

                    // Horizontal rule
                    hr: () => <hr className="my-3 border-gray-200"/>,

                    // Links
                    a: ({href, children}) => (
                        <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                            {children}
                        </a>
                    ),

                    // Tables
                    table: ({children}) => (
                        <div className="overflow-x-auto my-2">
                            <table className="min-w-full border border-gray-200 rounded-lg text-sm">
                                {children}
                            </table>
                        </div>
                    ),
                    thead: ({children}) => (
                        <thead className="bg-gray-50">{children}</thead>
                    ),
                    tbody: ({children}) => (
                        <tbody className="divide-y divide-gray-200">{children}</tbody>
                    ),
                    tr: ({children}) => <tr>{children}</tr>,
                    th: ({children}) => (
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">
                            {children}
                        </th>
                    ),
                    td: ({children}) => (
                        <td className="px-3 py-2 text-sm text-gray-700">{children}</td>
                    ),
                }}
            >
                {processedContent}
            </ReactMarkdown>
        </div>
    );
};

export default MarkdownRenderer;