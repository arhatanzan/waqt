import type { Metadata } from "next";
import Ingredients from "@/components/ingredients";

export const metadata: Metadata = { title: "Ingredient Guide | Waqt" };
export default function Page() { return <Ingredients />; }
