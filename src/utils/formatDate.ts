
import { format } from "date-fns";

export const formatDate = (dateStr: string): string => {
  return format(new Date(dateStr), "MMM d, yyyy, HH:mm");
};
