import {useQuery} from "@tanstack/react-query";
import {getCategories, getSubcategories} from "@/api/categories";
export function useCategories() { return useQuery({queryKey: ["categories", "active"], queryFn: getCategories}); }
export function useSubcategories(categoryId: string) { return useQuery({queryKey: ["subcategories", categoryId, "active"], queryFn: () => getSubcategories(categoryId), enabled: Boolean(categoryId)}); }
