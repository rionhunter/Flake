export interface Entry {
  id: string;
  text: string;
  children: Entry[];
  tags?: string[];
  content?: string;
}

export interface NavigationPath {
  columnIndex: number;
  entryId: string | null;
}
