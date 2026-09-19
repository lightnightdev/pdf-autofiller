function getBreakdown(colIndex) {
  const csvData = Alpine.store("csvState").csvData;
  if (colIndex >= csvData[0].length) return [];

  // Skip header row
  const rows = csvData.slice(1);

  const counts = {};
  for (const row of rows) {
    const value = row[colIndex] ?? "";
    counts[value] = (counts[value] || 0) + 1;
  }

  return Object.entries(counts).map(([value, count]) => ({ value, count }));
}

function saveConditionalCheckmarks() {
  const cc = Alpine.store('conditionalCheckmark');
  const csvState = Alpine.store('csvState');
  
  if (!cc.selectedColumn || !cc.selectedColumnIndex) {
    alert('Please select a column first');
    return;
  }
  
  // Get all values that have checkmark or input state
  const activeRows = Object.entries(cc.rowStates).filter(([value, state]) => 
    state === 'checkmark' || state === 'input'
  );
  
  if (activeRows.length === 0) {
    alert('Please select at least one row as checkmark or input');
    return;
  }
  
  // Add new column headers
  const newHeaders = activeRows.map(([value, state]) => {
    if (state === 'checkmark') {
      return `✓-${cc.selectedColumn}-${value}`;
    } else {
      // input state
      const customText = cc.inputValues[value] || value;
      return `${customText}-${cc.selectedColumn}`;
    }
  });
  
  // Add headers to first row
  csvState.csvData[0].push(...newHeaders);
  
  // Process each data row
  for (let i = 1; i < csvState.csvData.length; i++) {
    const rowValue = csvState.csvData[i][cc.selectedColumnIndex] ?? "";
    
    // For each new column, add checkmark or custom text if match
    activeRows.forEach(([value, state]) => {
      if (rowValue === value) {
        if (state === 'checkmark') {
          csvState.csvData[i].push('✓');
        } else {
          const customText = cc.inputValues[value] || '';
          csvState.csvData[i].push(customText);
        }
      } else {
        csvState.csvData[i].push('');
      }
    });
  }
  
  // Reset and close modal
  cc.reset();
  Alpine.store('viewState').showConditionalCheckmarkModal = false;
  
  alert(`Added ${activeRows.length} new column(s)`);
}