// === selectors ===
const calcBtn = document.getElementById("calcBtn");
// use #clearBtn if you have it, otherwise fall back to .clear
const clearBtn =
  document.getElementById("clearBtn") || document.querySelector(".clear");
const results = document.getElementById("results");
const amountInput = document.getElementById("amount");

// Format amount input while typing
amountInput.addEventListener("input", (e) => {
  // Remove any characters that aren't numbers or commas
  let value = e.target.value.replace(/[^\d,]/g, "");

  // Remove all commas and format with new commas
  value = value.replace(/,/g, "");
  value = Number(value).toLocaleString("en-GB");

  // Handle empty or invalid input
  if (value === "0" || value === "NaN") value = "";

  e.target.value = value;
});

// === helpers ===
function showError(inputId, message) {
  const input = document.getElementById(inputId);
  input.setAttribute("aria-invalid", "true");
  const formGroup = input.closest(".form-group");
  const wrapper = input.parentElement; // .input-with-icon or .input-with-suffix
  const errorMsg = formGroup.querySelector(".error-message"); // assumes it exists in HTML

  if (errorMsg) {
    errorMsg.textContent = message;
    errorMsg.style.display = "block";
  }
  wrapper.classList.add("error"); // border + bg
  formGroup.classList.add("error"); // (optional) if you want label tweaks later
}

function clearError(inputId) {
  const input = document.getElementById(inputId);
  input.setAttribute("aria-invalid", "false");
  const formGroup = input.closest(".form-group");
  const wrapper = input.parentElement;
  const errorMsg = formGroup.querySelector(".error-message");

  if (errorMsg) errorMsg.style.display = "none";
  wrapper.classList.remove("error");
  formGroup.classList.remove("error");
}

// infer mortgage type safely if radios lack value=""
function getSelectedMortgageType() {
  const typeInput = document.querySelector('input[name="type"]:checked');
  if (!typeInput) return null;

  if (typeInput.value) return typeInput.value; // ideal case

  // fallback: infer from label text
  const labelText =
    typeInput
      .closest(".radio")
      ?.querySelector("span")
      ?.textContent?.toLowerCase() || "";
  if (labelText.includes("interest")) return "interest-only";
  return "repayment";
}

// === main ===
function calculateRepayments(e) {
  e.preventDefault();

  const fields = [
    {
      id: "amount",
      value: document.getElementById("amount").value.replace(/,/g, ""),
      message: "This field is required",
    },
    {
      id: "term",
      value: document.getElementById("term").value,
      message: "This field is required",
    },
    {
      id: "rate",
      value: document.getElementById("rate").value,
      message: "This field is required",
    },
  ];

  let valid = true;

  // inputs
  fields.forEach((f) => {
    if (!f.value || parseFloat(f.value) <= 0) {
      showError(f.id, f.message);
      valid = false;
    } else {
      clearError(f.id);
    }
  });

  // radios
  const fieldset = document.querySelector("fieldset.form-group");
  const typeError = fieldset.querySelector(".error-message");
  const radioButtons = document.querySelectorAll(".radio");
  const type = getSelectedMortgageType();

  if (!type) {
    if (typeError) {
      typeError.textContent = "This field is required";
      typeError.style.display = "block";
    }
    fieldset.classList.add("error");
    radioButtons.forEach((r) => r.classList.add("error"));
    valid = false;
  } else {
    if (typeError) typeError.style.display = "none";
    fieldset.classList.remove("error");
    radioButtons.forEach((r) => r.classList.remove("error"));
  }

  if (!valid) return;

  // parse numbers
  const amount = parseFloat(
    document.getElementById("amount").value.replace(/,/g, "")
  );
  const termMonths = parseInt(document.getElementById("term").value, 10) * 12;
  const monthlyRate =
    parseFloat(document.getElementById("rate").value) / 100 / 12;

  let monthly, total;
  if (type === "repayment") {
    monthly =
      (amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -termMonths));
    total = monthly * termMonths;
  } else {
    monthly = amount * monthlyRate;
    total = monthly * termMonths;
  }

  results.classList.add("active");
  results.innerHTML = `
    <h2>Your results</h2>
    <p class="summary-text">Your results are shown below based on the information you provided. To adjust the result, edit the form and click "calculate repayments" again.</p>
    <div class="result-box">
      <p>Your monthly repayments</p>
      <h1>£${monthly.toLocaleString(undefined, {
        minimumFractionDigits: 2,
      })}</h1>
      <hr>
      <p>Total you'll repay over the term</p>
      <h2>£${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
    </div>
  `;
}

// events
calcBtn.addEventListener("click", calculateRepayments);

clearBtn?.addEventListener("click", (e) => {
  e.preventDefault();

  // reset inputs
  document.getElementById("amount").value = "";
  document.getElementById("term").value = "";
  document.getElementById("rate").value = "";

  // reset radios (no selection; or pick first one if you prefer)
  document
    .querySelectorAll('input[name="type"]')
    .forEach((r) => (r.checked = false));

  // clear errors
  ["amount", "term", "rate"].forEach(clearError);
  const fieldset = document.querySelector("fieldset.form-group");
  const typeError = fieldset.querySelector(".error-message");
  if (typeError) typeError.style.display = "none";
  fieldset.classList.remove("error");
  document
    .querySelectorAll(".radio")
    .forEach((r) => r.classList.remove("error"));

  // reset results pane
  results.classList.remove("active");
  results.innerHTML = `
    <div class="illustration">
      <img src="/assets/images/illustration-empty.svg" alt="calculator illustration">
    </div>
    <h2 class="results-topic">Results shown here</h2>
    <p>Complete the form and click <strong>"calculate repayments"</strong> to see what your monthly repayments would be.</p>
  `;
});
