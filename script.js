const $ = (id) => document.getElementById(id);
let selectedPriority = "balanced";

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 3000);
}

$("priorityChoices").addEventListener("click", (event) => {
  const button = event.target.closest("[data-priority]");
  if (!button) return;
  document.querySelectorAll(".choice").forEach((item) => item.classList.remove("active"));
  button.classList.add("active");
  selectedPriority = button.dataset.priority;
  if (selectedPriority === "walk") $("lessWalking").checked = true;
});

$("swapBtn").addEventListener("click", () => {
  const from = $("from"), to = $("to");
  [from.value, to.value] = [to.value, from.value];
});

const AREAS = {"Gulshan-e-Iqbal":[24.9215,67.0920],"NIPA":[24.9154,67.0990],"Clifton":[24.8138,67.0300],"Saddar":[24.8607,67.0100],"DHA (Defence)":[24.8000,67.0600],"Tariq Road":[24.8710,67.0600],"PECHS":[24.8680,67.0650],"Nazimabad":[24.9120,67.0300],"North Nazimabad":[24.9400,67.0400],"Liaquatabad":[24.9000,67.0400],"Federal B Area":[24.9300,67.0700],"Gulistan-e-Johar":[24.9200,67.1300],"Johar Chowrangi":[24.9180,67.1280],"Karachi University":[24.9400,67.1200],"Jinnah Airport":[24.9065,67.1608],"Malir":[24.8933,67.2000],"Korangi":[24.8300,67.1300],"Landhi":[24.8500,67.2100],"Orangi Town":[24.9500,66.9900],"Lyari":[24.8600,66.9900],"Keamari":[24.8300,66.9800],"Sea View":[24.7970,67.0300],"Bahadurabad":[24.8800,67.0700],"Shahrah-e-Faisal":[24.8700,67.0800]};
$("areaList").innerHTML = Object.keys(AREAS).map(n => `<option value="${n}"></option>`).join("");

function km(a, b) {
  const r = x => x * Math.PI / 180, dLat = r(b[0]-a[0]), dLng = r(b[1]-a[1]);
  const h = Math.sin(dLat/2)**2 + Math.cos(r(a[0])) * Math.cos(r(b[0])) * Math.sin(dLng/2)**2;
  return 12742 * Math.asin(Math.sqrt(h));
}
function nearestArea(pos) {
  let best = { name: "", km: Infinity };
  for (const [name, c] of Object.entries(AREAS)) { const d = km(pos, c); if (d < best.km) best = { name, km: d }; }
  return best;
}
async function reverseGeocode(lat, lng) {
  const ctrl = new AbortController(), t = setTimeout(() => ctrl.abort(), 5000);
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=16&accept-language=en&lat=${lat}&lon=${lng}`, { signal: ctrl.signal });
    if (!r.ok) return null;
    const a = (await r.json()).address || {};
    return a.suburb || a.neighbourhood || a.quarter || a.city_district || a.residential || null;
  } catch (_) { return null; } finally { clearTimeout(t); }
}
function setLoc(state, text) {
  const el = $("locStatus");
  el.textContent = text;
  el.className = "loc-status" + (state ? " " + state : "");
}
function useMyLocation() {
  const btn = $("useLocation");
  if (!navigator.geolocation) return setLoc("err", "This browser can't share your location. Type or pick your area instead.");
  if (!window.isSecureContext && location.protocol !== "file:") return setLoc("err", "Location needs a secure (https) page. Type or pick your area instead.");
  btn.disabled = true;
  setLoc("", "Finding your location…");
  navigator.geolocation.getCurrentPosition(async (p) => {
    const { latitude: lat, longitude: lng, accuracy } = p.coords;
    const near = nearestArea([lat, lng]);
    if (near.km > 45) {
      btn.disabled = false;
      return setLoc("err", "You seem to be outside Karachi. Pick your starting area from the list.");
    }
    const name = (await reverseGeocode(lat, lng)) || `Near ${near.name}`;
    $("from").value = name;
    setLoc("ok", `Starting from ${name} (accurate to about ${Math.round(accuracy)} m).`);
    showToast("Starting point set from your location.");
    btn.disabled = false;
  }, (err) => {
    btn.disabled = false;
    const msg = {
      1: "Location is blocked. Allow it in your browser's site settings, or type your area.",
      2: "Your device couldn't work out where you are. Turn on GPS/Wi-Fi or type your area.",
      3: "Finding your location took too long. Try again or type your area."
    }[err.code] || "Couldn't get your location. Please type your area.";
    setLoc("err", msg);
  }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 });
}
$("useLocation").addEventListener("click", useMyLocation);
if (navigator.permissions) navigator.permissions.query({ name: "geolocation" }).then(r => { if (r.state === "granted") useMyLocation(); }).catch(() => {});

$("textSizeBtn").addEventListener("click", (e) => {
  const on = document.documentElement.classList.toggle("large");
  e.currentTarget.setAttribute("aria-pressed", on);
});

function startVoiceSearch() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    $("voiceStatus").textContent = "Voice search is not supported here. Try Chrome, or type your locations above.";
    showToast("Voice search is not supported in this browser.");
    return;
  }
  const recognition = new SpeechRecognition();
  recognition.lang = "en-PK";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  $("voiceStatus").textContent = "Listening… Say your starting point and destination.";
  $("voiceBtn").classList.add("listening");
  recognition.start();
  recognition.onresult = (event) => {
    const spoken = event.results[0][0].transcript.trim();
    const lower = spoken.toLowerCase();
    const split = lower.replace(/^from\s+/, "").match(/(.+?)\s+(?:to|se|say)\s+(.+)/i);
    if (split) {
      $("from").value = titleCase(split[1].trim());
      $("to").value = titleCase(split[2].trim());
    } else {
      $("to").value = titleCase(spoken);
    }
    $("voiceStatus").textContent = `Heard: “${spoken}”. Check the locations, then tap Find my route.`;
    showToast("Voice input added. Check your locations.");
  };
  recognition.onerror = () => {
    $("voiceStatus").textContent = "We couldn't hear that clearly. Please try again or type your destination.";
  };
  recognition.onend = () => $("voiceBtn").classList.remove("listening");
}
function titleCase(value) {
  return value.replace(/\b\w/g, char => char.toUpperCase());
}
$("voiceBtn").addEventListener("click", startVoiceSearch);
$("featureVoice").addEventListener("click", () => {
  $("planner").scrollIntoView({behavior:"smooth"});
  setTimeout(startVoiceSearch, 450);
});

$("journeyForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const from = $("from").value.trim();
  const to = $("to").value.trim();
  if (from.toLowerCase() === to.toLowerCase()) { showToast("Your start and destination are the same. Please change one."); return; }
  document.querySelector(".stop-a b").textContent = from;
  document.querySelector(".stop-d b").textContent = to;
  const budget = Math.max(0, Number($("budget").value || 0));
  const maxTransfers = Number($("transfers").value);
  const lessWalking = $("lessWalking").checked || selectedPriority === "walk";
  const cards = [...document.querySelectorAll(".route-card")];
  cards.forEach(card => {
    const cost = Number(card.dataset.cost);
    const transfers = Number(card.dataset.transfer);
    const walk = Number(card.dataset.walk);
    const eligible = cost <= budget && transfers <= maxTransfers && (!lessWalking || walk <= 6);
    card.classList.toggle("hidden-card", !eligible);
  });
  const visible = cards.filter(card => !card.classList.contains("hidden-card"));
  if (selectedPriority === "cheap") visible.sort((a,b) => Number(a.dataset.cost)-Number(b.dataset.cost));
  if (selectedPriority === "fast") visible.sort((a,b) => Number(a.dataset.min)-Number(b.dataset.min));
  if (selectedPriority === "walk") visible.sort((a,b) => Number(a.dataset.walk)-Number(b.dataset.walk));
  if (selectedPriority === "balanced") visible.sort((a,b) => score(a)-score(b));
  const container = $("routeResults");
  visible.forEach(card => container.appendChild(card));
  $("emptyState").classList.toggle("hidden", visible.length > 0);
  $("resultsSubtitle").textContent = `Example options from ${from} to ${to}. These sample routes are not connected to live route data.`;
  $("budgetNotice").querySelector("span:not(.notice-tag)").textContent = `At Rs. ${visible[0] ? visible[0].dataset.cost : "—"} each way, an example return journey costs about Rs. ${visible[0] ? Number(visible[0].dataset.cost)*2 : "—"}.`;
  $("results").scrollIntoView({behavior:"smooth", block:"start"});
  if (visible.length) showToast(`${visible.length} sample route option${visible.length === 1 ? "" : "s"} match your preferences.`);
});
function score(card) {
  return Number(card.dataset.cost) * .4 + Number(card.dataset.min) * .35 + Number(card.dataset.walk) * 2 + Number(card.dataset.transfer) * 8;
}

document.querySelectorAll(".details-btn").forEach(button => {
  button.addEventListener("click", () => {
    const details = button.nextElementSibling;
    details.classList.toggle("hidden");
    button.firstChild.textContent = details.classList.contains("hidden") ? "View step-by-step " : "Hide steps ";
  });
});

const modal = $("reportModal");
function openModal() { modal.classList.remove("hidden"); $("reportSuccess").classList.add("hidden"); setTimeout(() => $("reportArea").focus(), 50); }
function closeModal() { modal.classList.add("hidden"); }
$("reportOpen").addEventListener("click", openModal);
$("reportOpen2").addEventListener("click", openModal);
$("modalClose").addEventListener("click", closeModal);
modal.addEventListener("click", event => { if (event.target === modal) closeModal(); });
document.addEventListener("keydown", event => { if (event.key === "Escape") closeModal(); });

$("reportForm").addEventListener("submit", event => {
  event.preventDefault();
  const type = $("reportType").value;
  const area = $("reportArea").value.trim();
  const description = $("reportDescription").value.trim();
  const feed = document.querySelector(".update-feed");
  const article = document.createElement("article");
  article.className = "feed-item";
  const icon = type === "Bus delay" ? "⚠️" : type === "Stop location" ? "📍" : "📣";
  article.innerHTML = `<span class="feed-icon">${icon}</span><div><b></b><p></p><small>Just now · Demo report · Not verified</small></div><span class="feed-time">now</span>`;
  article.querySelector("b").textContent = `${type}: ${area}`;
  article.querySelector("p").textContent = description;
  feed.insertBefore(article, feed.querySelector(".feed-foot"));
  $("reportSuccess").classList.remove("hidden");
  $("reportForm").reset();
  showToast("Demo report added to the community feed.");
});

$("budgetFocus").addEventListener("click", () => {
  $("budget").focus();
  $("planner").scrollIntoView({behavior:"smooth"});
});
$("accessFocus").addEventListener("click", () => {
  $("lessWalking").checked = true;
  $("transfers").value = "1";
  $("planner").scrollIntoView({behavior:"smooth"});
  showToast("Preference set: shorter walks and up to one transfer.");
});
$("shareBtn").addEventListener("click", async () => {
  const text = `My sample Waylo journey: ${$("from").value} to ${$("to").value}. Check routes and estimated fares with Waylo.`;
  if (navigator.share) {
    try { await navigator.share({title:"My Waylo trip", text}); } catch (_) {}
  } else if (navigator.clipboard) {
    try { await navigator.clipboard.writeText(text); showToast("Trip summary copied. You can share it with someone you trust."); }
    catch (_) { showToast(text); }
  } else {
    showToast(text);
  }
});

$("languageBtn").addEventListener("click", () => showToast("Language toggle is a prototype. Urdu interface can be added next."));
