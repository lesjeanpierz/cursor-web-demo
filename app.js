const SUPABASE_URL = "https://mrgnikmhcyeoinzlklhx.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_IPGzCQOH6Jndt_eYdpiAxg_l0OXF5_Y";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const input = document.getElementById("input");
const addBtn = document.getElementById("addBtn");
const deleteSelectedBtn = document.getElementById("deleteSelectedBtn");
const list = document.getElementById("list");
const statusEl = document.getElementById("status");
const TASK_COLORS = [
  "#ff3366",
  "#00c2ff",
  "#ffc400",
  "#00d98b",
  "#b14dff",
  "#ff7b00",
  "#39ff14",
  "#ff3df2",
  "#00e5ff",
  "#ff1744",
];

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.style.color = isError ? "red" : "green";
}

function updateSelectionUI() {
  const selectedCount = list.querySelectorAll("input.idea-delete-checkbox:checked").length;
  deleteSelectedBtn.disabled = selectedCount === 0;
  deleteSelectedBtn.textContent =
    selectedCount === 0 ? "Supprimer sélection" : `Supprimer sélection (${selectedCount})`;
}

function getTaskColor(ideaId, index) {
  const base = Number.isFinite(Number(ideaId)) ? Number(ideaId) : index;
  return TASK_COLORS[Math.abs(base) % TASK_COLORS.length];
}

async function loadIdeas() {
  setStatus("Chargement...");

  const { data, error } = await supabaseClient
    .from("ideas")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    console.error("Erreur lecture :", error);
    setStatus("Erreur lecture : " + error.message, true);
    return;
  }

  list.innerHTML = "";

  if (!data || data.length === 0) {
    setStatus("Aucune idée en base.");
    updateSelectionUI();
    return;
  }

  data.forEach((idea, index) => {
    const li = document.createElement("li");
    li.className = "idea-item";
    li.style.setProperty("--task-color", getTaskColor(idea.id, index));
    li.style.setProperty("--task-index", String(index));

    const deleteCheckbox = document.createElement("input");
    deleteCheckbox.type = "checkbox";
    deleteCheckbox.className = "idea-delete-checkbox";
    deleteCheckbox.dataset.id = String(idea.id);

    const left = document.createElement("div");
    left.className = "idea-left";

    const titleText = document.createElement("span");
    titleText.className = "idea-title";
    titleText.textContent = String(idea.title);

    left.appendChild(deleteCheckbox);
    left.appendChild(titleText);

    li.appendChild(left);
    list.appendChild(li);
  });

  setStatus("", false);
  updateSelectionUI();
}

async function addIdea() {
  const title = input.value.trim();

  if (!title) {
    setStatus("Le champ est vide.", true);
    return;
  }

  setStatus("Insertion en cours...");

  const { data, error } = await supabaseClient.from("ideas").insert([{ title }]).select();

  if (error) {
    console.error("Erreur insertion :", error);
    setStatus("Erreur insertion : " + error.message, true);
    return;
  }

  console.log("Insertion OK :", data);
  input.value = "";
  setStatus("Insertion OK.");
  await loadIdeas();
}

addBtn.addEventListener("click", addIdea);

list.addEventListener("change", (e) => {
  if (!(e.target instanceof HTMLInputElement)) return;
  if (!e.target.classList.contains("idea-delete-checkbox")) return;
  updateSelectionUI();
});

deleteSelectedBtn.addEventListener("click", async () => {
  const checkedBoxes = Array.from(list.querySelectorAll("input.idea-delete-checkbox:checked"));
  const ids = checkedBoxes.map((cb) => cb.dataset.id).filter((id) => id !== undefined && id !== null);

  if (ids.length === 0) {
    setStatus("Aucune idée sélectionnée.", true);
    return;
  }

  const confirmed = confirm(`Supprimer ${ids.length} idée(s) ?`);
  if (!confirmed) return;

  setStatus("Suppression en lot...");

  const { error: deleteError } = await supabaseClient.from("ideas").delete().in("id", ids);

  if (deleteError) {
    console.error("Erreur suppression :", deleteError);
    setStatus("Erreur suppression : " + deleteError.message, true);
    return;
  }

  setStatus("Suppression OK.");
  await loadIdeas();
});

updateSelectionUI();
loadIdeas();
