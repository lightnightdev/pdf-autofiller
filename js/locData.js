// ====================== CSV ======================

function createNewColumn() {
    const modal = new CreateNewColumnModal();
    modal.onSave = (builderParts) => {
        log('built: '+ JSON.stringify(builderParts))
        console.log('Built column:', builderParts);
    };
}

function getCsvData() {
    return Alpine.store('csvState').csvData
}

// Create and download a CSV file with just the header row
function downloadHeadersOnlyCSV() {
  const csvData = Alpine.store('csvState').csvData;
  
  if (!csvData || csvData.length === 0) {
    alert('No CSV data loaded.');
    return;
  }

  const filename = (pdfState?.pdfName || 'headers_only') + '-autofill.csv';

  const headers = csvData[0];
  
  // Convert header row into a CSV string (UTF-8)
  const csvContent = headers.join(',') + '\n';

  // Create a UTF-8 BOM so Excel opens it correctly
  const bom = '\uFEFF'; // Byte Order Mark for UTF-8
  const blob = new Blob([bom + csvContent], {
    type: 'text/csv;charset=utf-8',
  });

  // Create temporary download link
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();

  // Clean up
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  log('Headers-only CSV downloaded.');
}

// Remove all non-numeric data from a specific column
function removeNonNumericFromColumn(colIdx) {
  const csvState = Alpine.store('csvState');
  const csvData = csvState.csvData;
  
  if (!csvData || csvData.length === 0) {
    alert('No CSV data loaded.');
    return;
  }
  
  if (colIdx < 0 || colIdx >= csvData[0].length) {
    alert('Invalid column index.');
    return;
  }
  
  const columnName = csvData[0][colIdx];
  const shouldClean = confirm(`Remove all non-numeric data from column "${columnName}"?`);
  
  if (!shouldClean) return;
  
  let removedCount = 0;
  
  // Start from row 1 (skip headers)
  for (let rowIdx = 1; rowIdx < csvData.length; rowIdx++) {
    const cellValue = csvData[rowIdx][colIdx];
    
    // Keep only digits, decimal points, and negative signs
    const cleanedValue = String(cellValue).replace(/[^0-9.-]/g, '');
    
    if (cellValue !== cleanedValue) {
      removedCount++;
    }
    
    csvData[rowIdx][colIdx] = cleanedValue;
  }
  
  // Trigger reactivity
  csvState.csvData = [...csvData];
  
  alert(`Cleaned ${removedCount} cells in column "${columnName}".`);
  log(`Removed non-numeric data from ${removedCount} cells in column ${colIdx}.`);
}


// ====================== CustomText ======================

function getCurrPageLocData() {
    const currPg = getCurrPgNum();
    return Alpine.store('locData').pages[currPg];
}

function getCurrPgNum() {
    const currPg = Alpine.store('viewState').currentPage ?? 1;
    return currPg;
}

function copyCustomText(idx) {
    let currPg = getCurrPgNum();
    let currentTxt = getCurrPageLocData().customText[idx].text;
    if (!confirm(`Duplicate this custom text (${currentTxt})?`)) { return; }

    duplicateCustomText(idx, currPg);
}

// Usage
function editCustomText(idx) {
    let currentTxt = getCurrPageLocData().customText[idx].text;
    new EditCustomTextModal(currentTxt, (newText) => {
        getCurrPageLocData().customText[idx].text = newText;
        if (getCurrPageLocData().customText[idx].spacing > 0) {
        queueUpdateRenderDoc();
    }
    });
}

function duplicateCustomText(itemId, pageNum, offsetX = 10, offsetY = 10) {
    const ld = Alpine.store('locData');

    // Get the original item
    const original = ld.pages[pageNum]?.customText[itemId];

    if (!original) {
        console.error('Custom text item not found');
        return null;
    }

    // Create new package with duplicated data
    let newId = generateUniqueId();
    let package = {
        "x": original.x + offsetX,
        "y": original.y + offsetY,
        "stageW": original.stageW,
        "stageH": original.stageH,
        "font": original.font,
        "size": original.size,
        "spacing": original.spacing,
        "text": original.text
    };

    // Verify page exists and add the duplicate
    verifyPage(pageNum);
    ld.pages[pageNum].customText[newId] = package;

    // Select the newly created duplicate
    Alpine.store('viewState').selId(newId);

    return newId;
}


class EditCustomTextModal {
    constructor(originalText, onSave) {
        this.outputText = originalText;
        this.onSave = onSave;
        this.createModal();
        this.show();
    }

    createModal() {
        const dialog = document.createElement('dialog');
        dialog.className = 'my-modal';
        dialog.innerHTML = `
            <h2>Edit Custom Text</h2>
            <form id="editCustomText">
                <input type="text" id="text" value="${this.outputText}" required>
                <button type="submit">Change</button>
                <button type="button" id="cancelBtn">Cancel</button>
            </form>
        `;
        document.body.appendChild(dialog);
        this.dialog = dialog;
        this.form = dialog.querySelector('form');

        this.form.onsubmit = (e) => this.submit(e);
        dialog.querySelector('#cancelBtn').onclick = () => this.close();

        // Close on backdrop click
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) this.close();
        });
    }

    show() {
        this.dialog.showModal();
        Alpine.store('modal').open();
    }

    close() {
        Alpine.store('modal').close();
        this.dialog.close();
        this.destroy();
    }

    destroy() {
        Alpine.store('modal').close();
        this.dialog.remove(); // Clean up DOM
    }

    async submit(e) {
        e.preventDefault();
        const newText = this.form.querySelector('#text').value;
        if (this.onSave) await this.onSave(newText);
        this.close();
    }
}

function addConstructedColumn(builderParts) {
  const csvState = Alpine.store('csvState');
  const csvData = csvState.csvData;
  
  if (!csvData || csvData.length === 0) {
    alert('No CSV data loaded');
    return;
  }
  
  // Generate column name from builderParts
  let newColumnName = 'COPY: ';
  builderParts.forEach((part) => {
    if (part.type === 'column') {
      newColumnName += csvData[0][part.colIdx] + ' ';
    } else {
      newColumnName += part.text + ' ';
    }
  });
  newColumnName = newColumnName.trim();
  
  // Add new column header
  csvData[0].push(newColumnName);
  
  // Build data for each row
  for (let rowIdx = 1; rowIdx < csvData.length; rowIdx++) {
    let constructedValue = '';
    
    builderParts.forEach(part => {
      if (part.type === 'column') {
        constructedValue += csvData[rowIdx][part.colIdx] || '';
      } else {
        constructedValue += part.text;
      }
    });
    
    csvData[rowIdx].push(constructedValue);
  }
  
  log(`Added constructed column: ${newColumnName}`);
  
  // Trigger reactivity
  csvState.csvData = [...csvData];
}