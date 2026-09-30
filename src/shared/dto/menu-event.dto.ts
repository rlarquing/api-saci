export enum MenuEventType {
  CREATED = 'created',
  UPDATED = 'updated',
  DELETED = 'deleted',
}

export interface MenuEventPayload {
  action: MenuEventType;
  menuId: string;
  userId: string;
  timestamp: string;
}
