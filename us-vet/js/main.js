const WHATSAPP = "5551980592948";
const ADDRESS = "R. São Pedro, 399 - Centro, Sapiranga - RS, 93800-220";

const header = document.querySelector("[data-header]");
const toggle = document.querySelector("[data-nav-toggle]");
const nav = document.querySelector("[data-nav]");
const year = document.querySelector("[data-year]");
const form = document.querySelector("[data-booking-form]");
const success = document.querySelector("[data-booking-success]");
const progress = document.querySelector("[data-progress]");
const topBtn = document.querySelector("[data-top]");

if (year) {
  year.textContent = String(new Date().getFullYear());
}

const saoPauloHour = () => {
  const hour = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "numeric",
    hourCycle: "h23",
  }).format(new Date());
  return Number(hour);
};

const updateOpenStatus = () => {
  const hour = saoPauloHour();
  const open = hour >= 8 && hour < 22;
  const statusEl = document.querySelector("[data-open-status]");
  const labels = document.querySelectorAll("[data-open-label]");
  const text = open ? "Aberto agora · até 22h" : "Fechado agora · abre às 08h";
  if (statusEl) {
    statusEl.textContent = text;
    statusEl.classList.toggle("is-open", open);
    statusEl.classList.toggle("is-closed", !open);
  }
  labels.forEach((el) => {
    el.textContent = text;
  });
};

updateOpenStatus();

const onScroll = () => {
  const y = window.scrollY;
  header?.classList.toggle("is-scrolled", y > 12);
  if (progress) {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = `${max > 0 ? (y / max) * 100 : 0}%`;
  }
  if (topBtn) topBtn.hidden = y < 600;

  const fromTop = y + 120;
  const sections = [...document.querySelectorAll("main section[id]")];
  const current = [...sections].reverse().find((section) => section.offsetTop <= fromTop);
  nav?.querySelectorAll('a[href^="#"]').forEach((link) => {
    const match = current && link.getAttribute("href") === `#${current.id}`;
    link.classList.toggle("is-current", Boolean(match));
  });
};

onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

toggle?.addEventListener("click", () => {
  const open = nav?.classList.toggle("is-open");
  toggle.setAttribute("aria-expanded", String(Boolean(open)));
});

nav?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    nav.classList.remove("is-open");
    toggle?.setAttribute("aria-expanded", "false");
  });
});

topBtn?.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

const copyText = async (value) => {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
};

document.querySelector("[data-copy-address]")?.addEventListener("click", async (event) => {
  const ok = await copyText(ADDRESS);
  event.currentTarget.textContent = ok ? "Endereço copiado" : "Não foi possível copiar";
});

const maskPhone = (value) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").replace(/-$/, "");
  }
  return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").replace(/-$/, "");
};

form?.querySelector('[name="tutorTelefone"]')?.addEventListener("input", (event) => {
  event.target.value = maskPhone(event.target.value);
});

const dateInput = form?.querySelector('[name="data"]');
if (dateInput) {
  const today = new Date().toISOString().split("T")[0];
  dateInput.min = today;
}

const caso = form?.querySelector("[data-caso]");
const casoCount = document.querySelector("[data-caso-count]");
caso?.addEventListener("input", () => {
  if (casoCount) casoCount.textContent = String(caso.value.length);
});

let step = 1;
let lastMessage = "";

const panels = [...(form?.querySelectorAll("[data-panel]") ?? [])];
const dots = [...document.querySelectorAll("[data-step-dot]")];
const nextBtn = form?.querySelector("[data-next]");
const prevBtn = form?.querySelector("[data-prev]");
const submitBtn = form?.querySelector("[data-submit]");
const errorEl = form?.querySelector("[data-form-error]");

const showError = (message) => {
  if (!errorEl) return;
  errorEl.hidden = !message;
  errorEl.textContent = message || "";
};

const goTo = (next) => {
  step = next;
  panels.forEach((panel) => {
    const id = Number(panel.dataset.panel);
    panel.hidden = id !== step;
    panel.classList.toggle("is-active", id === step);
  });
  dots.forEach((dot) => {
    const id = Number(dot.dataset.stepDot);
    dot.classList.toggle("is-active", id === step);
    dot.classList.toggle("is-done", id < step);
  });
  if (prevBtn) prevBtn.hidden = step === 1;
  if (nextBtn) nextBtn.hidden = step === 4;
  if (submitBtn) submitBtn.hidden = step !== 4;
  showError("");
  const focusable = panels
    .find((panel) => Number(panel.dataset.panel) === step)
    ?.querySelector("input, select, textarea");
  focusable?.focus();
};

const validatePanel = (panelEl) => {
  const radios = [...panelEl.querySelectorAll('input[type="radio"]')];
  const radioNames = [...new Set(radios.filter((r) => r.required || r.name === "especie").map((r) => r.name))];
  for (const name of radioNames) {
    const group = panelEl.querySelectorAll(`input[name="${name}"]`);
    if (group.length && group[0].required && ![...group].some((r) => r.checked)) {
      return "Escolha a espécie do paciente.";
    }
  }

  for (const field of panelEl.querySelectorAll("input, select, textarea")) {
    if (field.type === "checkbox" || field.type === "radio") continue;
    if (!field.checkValidity()) {
      if (field.name === "tutorTelefone") return "Informe um telefone válido, com DDD.";
      if (field.name === "tutorEmail" && field.value) return "Confira o e-mail informado.";
      if (field.name === "data") return "Escolha uma data a partir de hoje.";
      return "Preencha os campos obrigatórios desta etapa.";
    }
  }

  const phone = form?.tutorTelefone?.value.replace(/\D/g, "") ?? "";
  if (panelEl.dataset.panel === "1" && phone.length < 10) {
    return "Informe um telefone válido, com DDD.";
  }
  return "";
};

nextBtn?.addEventListener("click", () => {
  const panel = panels.find((p) => Number(p.dataset.panel) === step);
  const message = panel ? validatePanel(panel) : "";
  if (message) {
    showError(message);
    return;
  }
  goTo(Math.min(4, step + 1));
});

prevBtn?.addEventListener("click", () => goTo(Math.max(1, step - 1)));

const readForm = () => {
  const data = new FormData(form);
  return {
    tutorNome: data.get("tutorNome")?.toString().trim() ?? "",
    tutorTelefone: data.get("tutorTelefone")?.toString().trim() ?? "",
    tutorEmail: data.get("tutorEmail")?.toString().trim() ?? "",
    primeiraVez: data.get("primeiraVez") ? "Sim" : "Não",
    petNome: data.get("petNome")?.toString().trim() ?? "",
    especie: data.get("especie")?.toString() ?? "",
    petIdade: data.get("petIdade")?.toString().trim() ?? "",
    servico: data.get("servico")?.toString() ?? "",
    dataPref: data.get("data")?.toString() ?? "",
    periodo: data.get("periodo")?.toString() ?? "",
    urgente: data.get("urgente") ? "Sim" : "Não",
    caso: data.get("caso")?.toString().trim() ?? "",
  };
};

const formatDate = (iso) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

const buildMessage = (info) =>
  [
    "Olá, US Vet! Gostaria de agendar um atendimento.",
    "",
    `*Tutor:* ${info.tutorNome}`,
    `*Telefone:* ${info.tutorTelefone}`,
    info.tutorEmail ? `*E-mail:* ${info.tutorEmail}` : null,
    `*Primeira vez:* ${info.primeiraVez}`,
    "",
    `*Pet:* ${info.petNome}`,
    `*Espécie:* ${info.especie}`,
    info.petIdade ? `*Idade:* ${info.petIdade}` : null,
    "",
    `*Serviço:* ${info.servico}`,
    `*Data preferida:* ${formatDate(info.dataPref)}`,
    `*Período:* ${info.periodo}`,
    `*Urgente:* ${info.urgente}`,
    "",
    `*Caso:* ${info.caso}`,
  ]
    .filter((line) => line !== null)
    .join("\n");

form?.addEventListener("submit", (event) => {
  event.preventDefault();
  const panel = panels.find((p) => Number(p.dataset.panel) === 4);
  const message = panel ? validatePanel(panel) : "";
  if (message) {
    showError(message);
    return;
  }

  const info = readForm();
  lastMessage = buildMessage(info);
  const url = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(lastMessage)}`;
  const waLink = success?.querySelector("[data-wa-link]");
  const copy = success?.querySelector("[data-success-copy]");

  if (copy) {
    copy.textContent = `${info.petNome} · ${info.servico} · ${formatDate(info.dataPref)} · ${info.periodo}`;
  }
  if (waLink) waLink.href = url;
  form.hidden = true;
  if (success) success.hidden = false;
  window.open(url, "_blank", "noopener");
});

document.querySelector("[data-copy-msg]")?.addEventListener("click", async (event) => {
  const ok = await copyText(lastMessage);
  event.currentTarget.textContent = ok ? "Mensagem copiada" : "Não foi possível copiar";
});

document.querySelector("[data-new-booking]")?.addEventListener("click", () => {
  form?.reset();
  if (casoCount) casoCount.textContent = "0";
  if (form) form.hidden = false;
  if (success) success.hidden = true;
  goTo(1);
});

document.querySelectorAll("[data-book]").forEach((button) => {
  button.addEventListener("click", () => {
    const service = button.getAttribute("data-book");
    const select = form?.querySelector('[name="servico"]');
    if (select && service) select.value = service;
    if (service === "Emergência") {
      const urgent = form?.querySelector('[name="urgente"]');
      if (urgent) urgent.checked = true;
    }
    goTo(1);
    document.querySelector("#agendar")?.scrollIntoView({ behavior: "smooth" });
  });
});

const dialog = document.querySelector("[data-lightbox-dialog]");
const dialogImg = document.querySelector("[data-lightbox-img]");

document.querySelectorAll("[data-lightbox]").forEach((button) => {
  button.addEventListener("click", () => {
    const src = button.getAttribute("data-lightbox");
    const img = button.querySelector("img");
    if (dialogImg && src) {
      dialogImg.src = src;
      dialogImg.alt = img?.alt ?? "";
    }
    dialog?.showModal();
  });
});

document.querySelector("[data-lightbox-close]")?.addEventListener("click", () => dialog?.close());
dialog?.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});
