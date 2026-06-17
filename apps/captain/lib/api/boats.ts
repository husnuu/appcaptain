import { useQuery } from "@tanstack/react-query";
import { editBoatMock, type EditBoatData } from "../mock/boat.mock";

function delay<T>(value: T, ms = 600): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

/** Loads a boat for the edit screen. Swap queryFn for GET /boats/:id. */
export function useEditBoat(id: string) {
  return useQuery<EditBoatData>({
    queryKey: ["boat", id, "edit"],
    queryFn: () => delay({ ...editBoatMock, id }),
  });
}
