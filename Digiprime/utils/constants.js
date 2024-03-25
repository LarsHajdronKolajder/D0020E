function getKeyForValue(value) {
    for (const key in keyValueMapping) {
      if (keyValueMapping[key](parseInt(value[0]))) {
        return key;
      }
    }
    return 'Unknown';
  }
const keyValueMapping = {
    "1": (value) => value < 100 || value === 100 || value === 150 || value === 200 || value === 250 || value === 300,
    "0.95": (value) => [350, 400, 450, 500].includes(value),
    "0.9": (value) => [550, 600, 650, 700, 750, 800].includes(value),
    "0.8": (value) => [850, 900, 950, 1000].includes(value),
  };

module.exports.interests = ["Supply", "Demand"];
module.exports.referenceSectors = ["Composites", "Batteries"];
module.exports.referenceTypes = ["Material", "Product"];

module.exports.Size = keyValueMapping;

module.exports.getKeyForValue = getKeyForValue;

module.exports.chemistry={
    "LCO - Lithium Cobalt Oxide (LiCoO2)": 1,
    "LMO - Lithium Manganese Oxide (LiMn2O4)": 0.8,
    "NMC111 - Lithium Nickel Manganese Cobalt Oxide (LiNiMnCoO2 111": 1,
    "NMC622 - Lithium Nickel Manganese Cobalt Oxide (LiNiMnCoO2 622)": 0.95,
    "NMC811 - Lithium Nickel Manganese Cobalt Oxide (LiNiMnCoO2 811)": 0.9,
    "LFP - Lithium Iron Phosphate (LiFePO4)": 0.8,
    "NCA - Lithium Nickel Cobalt Aluminum Oxide (LiNiCoAlO2)": 1,
    "LTO - Lithium Titanate (Li2TiO3)": 0.8,
    "Mixed chemistry": 0.8,
    "Other": 0.8
  };
module.exports.electrolyte={
    "Lithium hexafluorophosphate (LiPF6)": 1,
    "Lithium tetrafluoroborate (LiBF4)": 0.9,
    "Lithium perchlorate (LiClO4)": 0.9,
    "Other": 0.8
}

module.exports.cobalt={
    "V": 33, //euros per kilogram
    "K": 0.5 //percent
}
module.exports.lithium={
    "V": 52, //euros per kilogram
    "K": 0.2 //percent
}

