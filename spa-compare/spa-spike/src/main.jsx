import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
);

function Login({ onDone }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  async function submit(e) {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) setErr(error.message);
    else onDone();
  }

  return (
    <form onSubmit={submit}>
      <input
        placeholder="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="mật khẩu"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit">Đăng nhập</button>
      <p>{err}</p>
    </form>
  );
}

function App() {
  const [lists, setLists] = useState(null);
  const [needLogin, setNeedLogin] = useState(false);
  const [msg, setMsg] = useState("");

  async function load() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      setNeedLogin(true);
      return;
    }
    setNeedLogin(false);
    const { data, error } = await supabase
      .from("lists")
      .select("*,cards (*,checklists (*,items: checklistitems (*)))")
      .eq("user_id", session.user.id)
      .order("order", { ascending: true });
    if (error) setMsg(error.message);
    else setLists(data);
  }

  useEffect(() => {
    load();
  }, []);

  if (needLogin) return <Login onDone={load} />;
  if (msg) return <p>{msg}</p>;
  if (!lists) return <p>Đang tải…</p>;

  return (
    <main style={{ display: "flex", gap: 16, padding: 16 }}>
      {lists.map((l) => (
        <section key={l.id}>
          <h3>{l.title}</h3>
          <ul>
            {(l.cards ?? []).map((c) => (
              <li key={c.id}>{c.title}</li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
