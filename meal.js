let people = [];

function addPerson() {
  const index = people.length;

  const container = document.createElement("div");
  container.className = "person";
  container.id = `person${index}`;
  container.innerHTML = `
    <strong>Person ${index + 1}</strong><br>
    Name: <input type="text" id="name${index}" placeholder="Enter name">
    Market: <input type="number" id="market${index}" value="0">
    <label>
      <input type="checkbox" id="isRegular${index}" checked>
      Eats Regular Meals
    </label>
    <br><strong>Guest Meals:</strong><br>
    Type:
    <select id="guestMealType${index}">
      <option value="35">Veg (₹35)</option>
      <option value="40">Egg (₹40)</option>
      <option value="50">Fish (₹50)</option>
      <option value="55">Chicken (₹55)</option>
    </select>
    Qty: <input type="number" id="guestMealQty${index}" value="0" min="0">
    <button onclick="addGuestMeal(${index})">Add Guest Meal</button>
    <div id="guestList${index}"></div>
    <hr>
  `;

  document.getElementById("peopleContainer").appendChild(container);

  people.push({
    name: "",
    market: 0,
    isRegular: true,
    guestMeals: []
  });
}

function addGuestMeal(index) {
  const typeSelect = document.getElementById(`guestMealType${index}`);
  const qtyInput = document.getElementById(`guestMealQty${index}`);

  const unitCost = parseFloat(typeSelect.value);
  const qty = parseInt(qtyInput.value);
  const typeText = typeSelect.options[typeSelect.selectedIndex].text;

  if (qty <= 0) return;

  people[index].guestMeals.push({ unitCost, qty, typeText });

  const guestList = document.getElementById(`guestList${index}`);
  guestList.innerHTML = '';

  people[index].guestMeals.forEach(gm => {
    const total = gm.qty * gm.unitCost;
    const line = document.createElement("div");
    line.textContent = `+ ${gm.qty} x ₹${gm.unitCost} (${gm.typeText}) = ₹${total}`;
    guestList.appendChild(line);
  });
}

function calculate() {
  let totalMarket = 0;
  let fullMembers = [];
  let totalAllGuestCost = 0;

  // Gather data
  people.forEach((person, i) => {
    person.name = document.getElementById(`name${i}`).value || `Person ${i + 1}`;
    person.market = parseFloat(document.getElementById(`market${i}`).value || "0");
    person.isRegular = document.getElementById(`isRegular${i}`).checked;

    if (person.isRegular) {
      fullMembers.push(i);
      totalMarket += person.market;
    }

    totalAllGuestCost += person.guestMeals.reduce((sum, gm) => sum + gm.qty * gm.unitCost, 0);
  });

  const fullCount = fullMembers.length;
  const mealCostPerFull = (totalMarket / fullCount) - (totalAllGuestCost / fullCount);

  let output = `<h3>Final Dues:</h3>
  <p><strong>Per Meal Cost:</strong> ₹${mealCostPerFull.toFixed(2)}</p>`;

  people.forEach((person, i) => {
    let due = 0;
    const guestTotal = person.guestMeals.reduce((sum, gm) => sum + gm.qty * gm.unitCost, 0);

    if (person.isRegular) {
      due = person.market - mealCostPerFull;
    } else {
      due = -guestTotal;
    }

    const className = due >= 0 ? "positive" : "negative";
    const displayAmount = due >= 0
      ? `+₹${Math.abs(due).toFixed(2)}`
      : `-₹${Math.abs(due).toFixed(2)}`;

    output += `<div class="${className}">${person.name}: ${displayAmount}</div>`;
  });

  document.getElementById("output").innerHTML = output;
}

function exportToPDF() {
  const element = document.getElementById("output");

  const opt = {
    margin: 0.5,
    filename: 'meal-dues.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(element).save();
}

function exportToExcel() {
  const rows = [["Name", "Amount"]];
  const fullMembers = people.filter(p => p.isRegular);
  const totalMarket = fullMembers.reduce((sum, p) => sum + p.market, 0);
  const totalGuestCost = people.reduce((sum, p) =>
    sum + p.guestMeals.reduce((s, g) => s + g.qty * g.unitCost, 0), 0);
  const fullCount = fullMembers.length;
  const mealCostPerFull = (totalMarket / fullCount) - (totalGuestCost / fullCount);

  people.forEach(person => {
    const guestTotal = person.guestMeals.reduce((sum, gm) => sum + gm.qty * gm.unitCost, 0);

    let due = 0;
    if (person.isRegular) {
      due = person.market - mealCostPerFull;
    } else {
      due = -guestTotal;
    }

    const displayAmount = due >= 0
      ? `+₹${Math.abs(due).toFixed(2)}`
      : `-₹${Math.abs(due).toFixed(2)}`;

    rows.push([person.name, displayAmount]);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Meal Dues");
  XLSX.writeFile(wb, "meal-dues.xlsx");
}
