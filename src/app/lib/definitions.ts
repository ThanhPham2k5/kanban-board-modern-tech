export interface List {
  id: string;
  title: string;
  order: string;
}

export interface Card {
  id: string;
  list_id: string;
  title: string;
  description?: string;
  is_completed: boolean;
  order: string;
}

export interface Checklist {
  id: string;
  card_id: string;
  title: string;
  order: string;
}

export interface ChecklistItem {
  id: string;
  checklist_id: string;
  content: string;
  is_checked: boolean;
  order: string;
}

export type CreateChecklistInput = Omit<Checklist, "id">;
export type CreateChecklistItemInput = Omit<ChecklistItem, "id">;
export type UpdateChecklistItemInput = {
  content?: string;
  is_checked?: boolean;
};
export interface ChecklistWithItems extends Checklist {
  items: ChecklistItem[];
}
export interface CardWithChecklists extends Card {
  checklists: ChecklistWithItems[];
}
export interface ListWithCards extends List {
  cards: CardWithChecklists[];
}
