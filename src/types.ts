export type Role = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  attachments?: string[];
  type?: 'chat' | 'build';
  projectData?: Project;
  generatedMedia?: {
    type: 'image' | 'video';
    url: string;
  };
}

export interface Project {
  id: string;
  name: string;
  description: string;
  html: string;
  css: string;
  js: string;
  python?: string;
  timestamp: number;
}
