"use client";

import { createContext, useContext } from "react";
import type { ReadingPayload } from "@/lib/types";

/** Lets a room scene hand its engine result to the oracle chat. */
export const RoomReadingContext = createContext<{ share: (r: ReadingPayload) => void }>({ share: () => {} });
export const useShareReading = () => useContext(RoomReadingContext).share;
