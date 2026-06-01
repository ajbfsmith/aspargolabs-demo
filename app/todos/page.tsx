import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

type TodoRow = {
  id: string | number;
  name: string;
};

export default async function Page() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: todos } = await supabase.from("todos").select();

  return (
    <ul>
      {(todos as TodoRow[] | null)?.map((todo) => (
        <li key={todo.id}>{todo.name}</li>
      ))}
    </ul>
  );
}

