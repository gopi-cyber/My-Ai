import * as acorn from 'acorn';

export interface ValidationError {
  line: number;
  column: number;
  message: string;
  type: 'error' | 'warning';
}

export function validateJS(code: string): ValidationError[] {
  const errors: ValidationError[] = [];
  try {
    acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'module' });
  } catch (err: any) {
    if (err.loc) {
      errors.push({
        line: err.loc.line,
        column: err.loc.column,
        message: err.message.replace(/\s*\(.*\)\s*$/, ''),
        type: 'error'
      });
    } else {
      errors.push({
        line: 1,
        column: 0,
        message: err.message || "Unknown JS error",
        type: 'error'
      });
    }
  }
  return errors;
}

export function validateCSS(code: string): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Basic brace balance check
  let openBraces = 0;
  const lines = code.split('\n');
  
  lines.forEach((line, index) => {
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '{') openBraces++;
      if (line[i] === '}') openBraces--;
      
      if (openBraces < 0) {
        errors.push({
          line: index + 1,
          column: i,
          message: "Unexpected closing brace '}'",
          type: 'error'
        });
        openBraces = 0; // Reset to avoid cascade
      }
    }
  });
  
  if (openBraces > 0) {
    errors.push({
      line: lines.length,
      column: lines[lines.length - 1].length,
      message: `Missing ${openBraces} closing brace(s) '}'`,
      type: 'error'
    });
  }
  
  // Basic property check (missing semicolon)
  const propertyRegex = /([a-z-]+)\s*:\s*([^;{}]+)(?!;|\s*})/gi;
  lines.forEach((line, index) => {
    const match = propertyRegex.exec(line);
    if (match && !line.includes(';') && !line.trim().endsWith('{')) {
      // Very naive check, but helps
      // errors.push({ line: index + 1, column: match.index, message: "Missing semicolon", type: 'warning' });
    }
  });

  return errors;
}

export function validateHTML(code: string): ValidationError[] {
  const errors: ValidationError[] = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(code, 'text/html');
  
  const parserErrors = doc.querySelectorAll('parsererror');
  if (parserErrors.length > 0) {
    parserErrors.forEach(err => {
      errors.push({
        line: 1,
        column: 0,
        message: err.textContent || "HTML Parsing Error",
        type: 'error'
      });
    });
  }

  // Naive tag matching check
  const tagRegex = /<([a-z1-6]+)(?:\s+[^>]*)?>|<\/([a-z1-6]+)>/gi;
  const stack: { tag: string, line: number }[] = [];
  const lines = code.split('\n');
  
  lines.forEach((line, lineIdx) => {
    let match;
    while ((match = tagRegex.exec(line)) !== null) {
      const [full, open, close] = match;
      if (open) {
        // Self-closing tags to ignore
        const selfClosing = ['img', 'br', 'hr', 'input', 'meta', 'link', 'area', 'base', 'col', 'embed', 'param', 'source', 'track', 'wbr'];
        if (!selfClosing.includes(open.toLowerCase())) {
          stack.push({ tag: open.toLowerCase(), line: lineIdx + 1 });
        }
      } else if (close) {
        const last = stack.pop();
        if (!last || last.tag !== close.toLowerCase()) {
          errors.push({
            line: lineIdx + 1,
            column: match.index,
            message: `Unexpected closing tag </${close}>${last ? `, expected </${last.tag}>` : ''}`,
            type: 'error'
          });
        }
      }
    }
  });
  
  stack.forEach(unclosed => {
    errors.push({
      line: unclosed.line,
      column: 0,
      message: `Unclosed tag <${unclosed.tag}>`,
      type: 'error'
    });
  });

  return errors;
}

export function validatePython(code: string): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!code.trim()) return errors;
  
  // Basic indentation check
  const lines = code.split('\n');
  let inBlock = false;
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed.endsWith(':')) {
      inBlock = true;
    } else if (inBlock && line.length > 0 && !line.startsWith(' ') && !line.startsWith('\t')) {
      errors.push({
        line: index + 1,
        column: 0,
        message: "Expected indented block",
        type: 'error'
      });
      inBlock = false;
    } else if (trimmed.length > 0) {
      inBlock = false;
    }
  });

  // Check for common syntax errors (very basic)
  lines.forEach((line, index) => {
    const openParens = (line.match(/\(/g) || []).length;
    const closeParens = (line.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      errors.push({
        line: index + 1,
        column: 0,
        message: "Mismatched parentheses",
        type: 'error'
      });
    }
  });

  return errors;
}
