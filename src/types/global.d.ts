/// <reference types="react" />
/// <reference types="react-dom" />
/// <reference types="next" />

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

declare module '*.svg' {
  const content: React.FunctionComponent<React.SVGAttributes<SVGElement>>;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.jpeg' {
  const content: string;
  export default content;
}

declare module '*.gif' {
  const content: string;
  export default content;
}

declare module '*.webp' {
  const content: string;
  export default content;
}

// React types
declare module 'react' {
  import * as React from 'react';
  export = React;
  export as namespace React;
}

// React hooks
declare module 'react' {
  export function useState<T>(initialState: T | (() => T)): [T, (newState: T | ((prevState: T) => T)) => void];
  export function useEffect(effect: () => void | (() => void), deps?: ReadonlyArray<any>): void;
  export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: ReadonlyArray<any>): T;
  export function useMemo<T>(factory: () => T, deps: ReadonlyArray<any>): T;
}

// Next.js types
declare module 'next' {
  export interface Metadata {
    title?: string;
    description?: string;
    keywords?: string;
    authors?: Array<{ name: string }>;
  }

  export interface Viewport {
    width?: string;
    initialScale?: number;
  }
}

declare module 'next/link' {
  import { ComponentType, ReactNode } from 'react';
  
  interface LinkProps {
    href: string;
    children: ReactNode;
    className?: string;
  }
  
  const Link: ComponentType<LinkProps>;
  export default Link;
}

declare module 'next/font/google' {
  import { NextFontWithVariable } from 'next/dist/compiled/@next/font';
  
  export function Inter(options: { subsets: string[] }): NextFontWithVariable;
}

// Tesseract.js types
declare module 'tesseract.js' {
  export interface WorkerOptions {
    logger?: (m: any) => void;
    tessedit_char_whitelist?: string;
    tessedit_pageseg_mode?: number;
    tessedit_ocr_engine_mode?: number;
    [key: string]: any;
  }

  export interface RecognizeResult {
    data: {
      text: string;
      confidence: number;
    };
  }

  export interface Worker {
    recognize(image: string | HTMLImageElement | HTMLCanvasElement, options?: WorkerOptions): Promise<RecognizeResult>;
    terminate(): Promise<void>;
  }

  export const createWorker: (options?: WorkerOptions) => Promise<Worker>;
  export const recognize: (image: string | HTMLImageElement | HTMLCanvasElement, lang?: string, options?: WorkerOptions) => Promise<RecognizeResult>;
  
  export const PSM: {
    AUTO: number;
    SINGLE_BLOCK: number;
    SINGLE_LINE: number;
    SINGLE_WORD: number;
    SINGLE_CHAR: number;
  };

  export const OEM: {
    LSTM_ONLY: number;
    TESSERACT_ONLY: number;
    TESSERACT_LSTM_COMBINED: number;
    DEFAULT: number;
  };
}

// XLSX types
declare module 'xlsx' {
  export interface WorkSheet {
    [key: string]: any;
  }

  export interface WorkBook {
    SheetNames: string[];
    Sheets: { [key: string]: WorkSheet };
  }

  export const utils: {
    book_new(): WorkBook;
    json_to_sheet(data: any[]): WorkSheet;
    book_append_sheet(workbook: WorkBook, worksheet: WorkSheet, name: string): void;
  };

  export const writeFile: (workbook: WorkBook, filename: string) => void;
} 
