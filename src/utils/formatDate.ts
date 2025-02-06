import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export const formatDate = (dateStr: string): string => {
  return formatDistanceToNow(new Date(dateStr), { 
    addSuffix: true,
    locale: ptBR 
  });
};