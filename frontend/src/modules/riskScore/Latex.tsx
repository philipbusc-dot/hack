import { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css'; // Don't forget the styles!

interface LatexProps {
  text?: string;
  children?: string;
  displayMode?: boolean;
}

export default function Latex({ text, children, displayMode = false }: LatexProps) {
  const containerRef = useRef<HTMLSpanElement>(null);

  const raw = (text ?? children ?? '').trim();
  // KaTeX's render() expects a bare expression, not `$`/`$$`-delimited input.
  const isDisplay = displayMode || raw.startsWith('$$');
  const formula = raw.replace(/^\$\$?|\$\$?$/g, '').trim();

  useEffect(() => {
    if (containerRef.current) {
      try {
        katex.render(formula, containerRef.current, {
          throwOnError: false,
          displayMode: isDisplay,
        });
      } catch (error) {
        console.error('KaTeX error:', error);
      }
    }
  }, [formula, isDisplay]);

  return <span ref={containerRef} />;
}
