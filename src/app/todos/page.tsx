"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";

type Todo = {
  id: string;
  text: string;
  is_done: boolean;
  created_at: string;
};

export default function TodosPage() {
  const router = useRouter();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(true);

  // Check auth and load todos on mount
  useEffect(() => {
    async function init() {
      const { data: { session } } = await getSupabase().auth.getSession();
      if (!session) {
        router.replace("/login");
        return;
      }
      const meta = session.user.user_metadata;
      setUserEmail(
        session.user.email
          || meta?.full_name
          || meta?.name
          || meta?.preferred_username
          || "User"
      );
      await loadTodos();
      setLoading(false);
    }
    init();
  }, [router]);

  async function loadTodos() {
    const { data, error } = await getSupabase()
      .from("todos")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setTodos(data);
    }
  }

  async function addTodo(e: React.FormEvent) {
    e.preventDefault();
    if (!newTodo.trim()) return;

    const { error } = await getSupabase()
      .from("todos")
      .insert({ text: newTodo.trim() });

    if (!error) {
      setNewTodo("");
      await loadTodos();
    }
  }

  async function toggleTodo(id: string, currentStatus: boolean) {
    const { error } = await getSupabase()
      .from("todos")
      .update({ is_done: !currentStatus })
      .eq("id", id);

    if (!error) {
      setTodos(todos.map((t) =>
        t.id === id ? { ...t, is_done: !currentStatus } : t
      ));
    }
  }

  async function deleteTodo(id: string) {
    const { error } = await getSupabase()
      .from("todos")
      .delete()
      .eq("id", id);

    if (!error) {
      setTodos(todos.filter((t) => t.id !== id));
    }
  }

  async function handleSignOut() {
    await getSupabase().auth.signOut();
    router.replace("/login");
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      {/* Header */}
      <div className="max-w-lg mx-auto flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">My Todos</h1>
          <p className="text-sm text-gray-500">{userEmail}</p>
        </div>
        <button
          onClick={handleSignOut}
          className="text-sm text-red-600 hover:underline"
        >
          Sign Out
        </button>
      </div>

      {/* Add todo form */}
      <form onSubmit={addTodo} className="max-w-lg mx-auto flex gap-2 mb-6">
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="What do you need to do?"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Add
        </button>
      </form>

      {/* Todo list */}
      <div className="max-w-lg mx-auto space-y-2">
        {todos.length === 0 && (
          <p className="text-center text-gray-400 py-8">
            No todos yet. Add one above!
          </p>
        )}

        {todos.map((todo) => (
          <div
            key={todo.id}
            className="flex items-center gap-3 bg-white p-3 rounded-md shadow-sm"
          >
            <input
              type="checkbox"
              checked={todo.is_done}
              onChange={() => toggleTodo(todo.id, todo.is_done)}
              className="h-5 w-5 rounded"
            />
            <span
              className={`flex-1 ${
                todo.is_done ? "line-through text-gray-400" : "text-gray-800"
              }`}
            >
              {todo.text}
            </span>
            <button
              onClick={() => deleteTodo(todo.id)}
              className="text-red-400 hover:text-red-600 text-sm"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
