
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const formatDate = (dateStr: string): string => {
  return format(new Date(dateStr), "d 'de' MMM. 'de' yyyy, HH:mm", {
    locale: ptBR
  });
};
