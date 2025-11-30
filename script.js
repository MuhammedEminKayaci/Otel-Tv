// ==========================
// TV UYUMLU BASİT SCRIPT
// ==========================

if (!window.console) {
  window.console = {
    log: function () {},
    warn: function () {},
    error: function () {}
  };
}

// -------------------------
// TV ALGILAMA (sadece font için)
// -------------------------
function detectTV() {
  var ua = navigator.userAgent || "";
  var isTV =
    /TV|SmartTV|Tizen|WebTV|WebOS|NetCast|NetTV|HbbTV|VIDAA|Hisense|PhilipsTV|Opera TV|Vewd/i.test(
      ua
    ) || screen.width >= 2500;

  if (isTV) {
    document.body.className += " tv-view";
  }
}

// -------------------------
// TARİH / SAAT
// -------------------------
var MONTH_NAMES_TR = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
];

var DAY_NAMES_TR = [
  "Pazar", "Pazartesi", "Salı", "Çarşamba",
  "Perşembe", "Cuma", "Cumartesi"
];

function pad2(n) {
  return n < 10 ? "0" + n : "" + n;
}

function updateLocalDateTime() {
  var now = new Date();
  var day = now.getDate();
  var month = now.getMonth();
  var year = now.getFullYear();
  var weekday = now.getDay();

  var h = now.getHours();
  var m = now.getMinutes();
  var s = now.getSeconds();

  var dateStr = pad2(day) + " " + MONTH_NAMES_TR[month] + " " + year;
  var dayStr = DAY_NAMES_TR[weekday];
  var timeStr = pad2(h) + ":" + pad2(m) + ":" + pad2(s);

  var dateEl = document.getElementById("current-date");
  var dayEl = document.getElementById("current-day");
  var timeEl = document.getElementById("current-time");

  if (dateEl) dateEl.innerHTML = dateStr;
  if (dayEl) dayEl.innerHTML = dayStr;
  if (timeEl) timeEl.innerHTML = timeStr;
}

// Dünya saatleri (yaklaşık)
function formatHM(dateObj) {
  return pad2(dateObj.getHours()) + ":" + pad2(dateObj.getMinutes());
}

function updateWorldClocks() {
  var now = new Date();
  var utcMs = now.getTime() + now.getTimezoneOffset() * 60000;

  var london = new Date(utcMs + 0 * 3600000);   // UTC
  var newyork = new Date(utcMs - 5 * 3600000);  // UTC-5
  var tokyo  = new Date(utcMs + 9 * 3600000);   // UTC+9
  var dubai  = new Date(utcMs + 4 * 3600000);   // UTC+4
  var mecca  = new Date(utcMs + 3 * 3600000);   // UTC+3
  var beijing = new Date(utcMs + 8 * 3600000);  // UTC+8

  var elLon = document.getElementById("time-london");
  var elNy  = document.getElementById("time-ny");
  var elTk  = document.getElementById("time-tokyo");
  var elDubai = document.getElementById("time-dubai");
  var elMecca = document.getElementById("time-mecca");
  var elBeijing = document.getElementById("time-beijing");

  if (elLon) elLon.innerHTML = formatHM(london);
  if (elNy)  elNy.innerHTML  = formatHM(newyork);
  if (elTk)  elTk.innerHTML  = formatHM(tokyo);
  if (elDubai) elDubai.innerHTML = formatHM(dubai);
  if (elMecca) elMecca.innerHTML = formatHM(mecca);
  if (elBeijing) elBeijing.innerHTML = formatHM(beijing);
}

// -------------------------
// HAVA DURUMU (Open-Meteo, çalışmazsa "Bağlantı yok")
// -------------------------
var KARS_LAT = 40.601;
var KARS_LON = 43.097;

var weatherCodeMap = {
  0: "Açık",
  1: "Genelde açık",
  2: "Parçalı bulutlu",
  3: "Bulutlu",
  45: "Sisli",
  48: "Yoğun sis",
  51: "Çiseleme",
  53: "Çiseleme",
  55: "Yoğun çiseleme",
  61: "Hafif yağmur",
  63: "Yağmur",
  65: "Kuvvetli yağmur",
  71: "Kar",
  73: "Kar",
  75: "Yoğun kar",
  80: "Sağanak",
  81: "Kuvvetli sağanak",
  82: "Fırtınalı sağanak",
  95: "Gök gürültülü",
  96: "Dolu",
  99: "Kuvvetli dolu"
};

function xhrGetJson(url, onSuccess, onError) {
  try {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            var data = JSON.parse(xhr.responseText);
            onSuccess(data);
          } catch (e) {
            if (onError) onError(e);
          }
        } else {
          if (onError) onError(xhr);
        }
      }
    };
    xhr.send(null);
  } catch (e) {
    if (onError) onError(e);
  }
}

function fetchWeather() {
  var url =
    "https://api.open-meteo.com/v1/forecast?latitude=" +
    KARS_LAT +
    "&longitude=" +
    KARS_LON +
    "&current_weather=true&timezone=Europe%2FIstanbul";

  xhrGetJson(
    url,
    function (data) {
      if (!data || !data.current_weather) return;

      var cw = data.current_weather;
      var temp = typeof cw.temperature === "number" ? cw.temperature : null;
      var code = cw.weathercode;

      var tempEl = document.getElementById("weather-temp");
      var descEl = document.getElementById("weather-desc");

      if (tempEl && temp !== null) {
        tempEl.innerHTML = Math.round(temp) + "°";
      }
      if (descEl) {
        if (weatherCodeMap.hasOwnProperty(code)) {
          descEl.innerHTML = weatherCodeMap[code];
        } else {
          descEl.innerHTML = "Hava bilgisi";
        }
      }
    },
    function () {
      var descEl = document.getElementById("weather-desc");
      if (descEl) descEl.innerHTML = "Bağlantı yok";
    }
  );
}

// -------------------------
// DÖVİZLER – DİNAMİK (5 dk) + Statik yedek
// -------------------------
var rubleSymbol = "₽"; // varsayılan
var manatSymbol = "₼"; // varsayılan

function ensureRubleSymbol() {
  try {
    var test = document.createElement("span");
    test.style.position = "absolute";
    test.style.opacity = "0";
    test.innerHTML = rubleSymbol;
    document.body.appendChild(test);
    // Eğer genişlik yoksa veya font fallback başarısızsa sembolü kod ile değiştir
    if (!test.offsetWidth || test.offsetWidth < 4) {
      rubleSymbol = " RUB"; // fallback
    }
    document.body.removeChild(test);
  } catch (e) {
    rubleSymbol = " RUB";
  }
}

function ensureManatSymbol() {
  try {
    var test = document.createElement("span");
    test.style.position = "absolute";
    test.style.opacity = "0";
    test.style.fontFamily = "Segoe UI, Arial Unicode MS, Arial, sans-serif";
    test.innerHTML = manatSymbol;
    document.body.appendChild(test);
    // Eğer genişlik yoksa veya font fallback başarısızsa sembolü kod ile değiştir
    if (!test.offsetWidth || test.offsetWidth < 4) {
      manatSymbol = " AZN"; // fallback
    }
    document.body.removeChild(test);
  } catch (e) {
    manatSymbol = " AZN";
  }
}

function initStaticRates() {
  setRateValue("rate-usd", 34.50, "$");
  setRateValue("rate-eur", 37.28, "€");
  setRateValue("rate-gbp", 43.90, "£");
  setRateValue("rate-chf", 38.85, "Fr");
  setRateValue("rate-azn", 20.30, manatSymbol);
}

function setRateValue(id, value, symbol) {
  var el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = value.toFixed(2) + symbol;
}

function fetchRatesPrimary(onDone, onFail) {
  xhrGetJson("https://open.er-api.com/v6/latest/TRY", function (data) {
    if (data && data.rates) onDone(data.rates); else onFail();
  }, onFail);
}

function fetchRatesFallback(onDone, onFail) {
  xhrGetJson("https://api.exchangerate.host/latest?base=TRY", function (data) {
    if (data && data.rates) onDone(data.rates); else onFail();
  }, onFail);
}

function applyRates(rates) {
  if (!rates) return;
  // 1 TRY = r CODE => 1 CODE = 1/r TRY
  updateRate("USD", "rate-usd", rates);
  updateRate("EUR", "rate-eur", rates);
  updateRate("GBP", "rate-gbp", rates);
  updateRate("CHF", "rate-chf", rates);
  updateRate("AZN", "rate-azn", rates, manatSymbol);
}

function updateRate(code, id, rates, customSymbol) {
  var el = document.getElementById(id);
  if (!el) return;
  var r = rates[code];
  if (typeof r !== "number") {
    el.innerHTML = "--";
    return;
  }
  var tlPerUnit = 1 / r;
  var symbol;
  switch (code) {
    case "USD": symbol = "$"; break;
    case "EUR": symbol = "€"; break;
    case "GBP": symbol = "£"; break;
    case "CHF": symbol = "Fr"; break;
    case "AZN": symbol = customSymbol || manatSymbol; break;
    default: symbol = code;
  }
  el.innerHTML = tlPerUnit.toFixed(2) + symbol;
}

function fetchRatesDynamic() {
  fetchRatesPrimary(
    function (rates) { applyRates(rates); },
    function () {
      fetchRatesFallback(
        function (rates) { applyRates(rates); },
        function () { initStaticRates(); }
      );
    }
  );
}

// -------------------------
// VIDEO AUTOPLAY + PERFORMANS OPTİMİZASYONU
// -------------------------
function ensureVideoPlays() {
  var video = document.getElementById("hotel-video");
  if (!video) return;

  try {
    // Smart TV optimizasyonları
    video.muted = true;
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
    
    // Donanım hızlandırma için ipucu
    video.style.transform = "translateZ(0)";
    video.style.webkitTransform = "translateZ(0)";
    
    // Video yüklenene kadar bekle
    if (video.readyState < 3) {
      video.addEventListener("canplay", function onCanPlay() {
        video.removeEventListener("canplay", onCanPlay);
        video.play();
      });
    } else {
      var playPromise = video.play && video.play();
      if (playPromise && playPromise.catch) {
        playPromise.catch(function () {
          setTimeout(ensureVideoPlays, 3000);
        });
      }
    }
  } catch (e) {}
}

// Ok tuşları sayfayı kaydırmasın
document.addEventListener("keydown", function (e) {
  var keys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "PageUp", "PageDown"];
  for (var i = 0; i < keys.length; i++) {
    if (e.key === keys[i]) {
      e.preventDefault();
      break;
    }
  }
});

// 24 saatte bir yenile
function scheduleAutoReload() {
  var ONE_DAY_MS = 24 * 60 * 60 * 1000;
  setTimeout(function () {
    location.reload();
  }, ONE_DAY_MS);
}

// -------------------------
// INIT
// -------------------------
document.addEventListener("DOMContentLoaded", function () {
  detectTV();
  ensureRubleSymbol();
  ensureManatSymbol();

  updateLocalDateTime();
  updateWorldClocks();
  fetchWeather();
  fetchRatesDynamic(); // canlı kurlar
  ensureVideoPlays();
  scheduleAutoReload();

  setInterval(updateLocalDateTime, 1000);
  setInterval(updateWorldClocks, 1000);
  setInterval(fetchWeather, 10 * 60 * 1000);
  setInterval(fetchRatesDynamic, 5 * 60 * 1000); // 5 dakikada bir güncelle
});
