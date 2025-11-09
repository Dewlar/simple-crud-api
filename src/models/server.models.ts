export interface CreateUserPayload {
  id: string;
  username: string;
  age: number;
  hobbies: string[];
}

export interface UpdateUserPayload {
  id: string;
  username: string;
  age: number;
  hobbies: string[];
}

export interface DeleteUserPayload {
  id: string;
}

export type WorkerToMasterMessage =
  | { type: 'requestState' }
  | { type: 'update'; action: 'create'; payload: CreateUserPayload }
  | { type: 'update'; action: 'update'; payload: UpdateUserPayload }
  | { type: 'update'; action: 'delete'; payload: DeleteUserPayload };

export type MasterToWorkerMessage =
  | { type: 'replaceState'; state: CreateUserPayload[] };
