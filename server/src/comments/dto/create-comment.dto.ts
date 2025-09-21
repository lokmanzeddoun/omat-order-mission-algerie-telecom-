export class CreateCommentDto {
  title: string;
  type: string; // use MessageType enum values (FORGET_PASSWORD, DECOMPTE_STATUS, OTHER)
  status?: string;
  decompteId?: number | null;
  // When the requester is not authenticated they can provide their email to link the comment to their account
  email?: string;
  userId?: number;
}
