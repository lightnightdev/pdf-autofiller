let prevSpacing = 0;

document.addEventListener("alpine:init", () => {
  // ====================== LOC DATA STORE ======================
  Alpine.store("locData", {
    getCurrentCustomText() {
      const currentPage = Alpine.store("viewState").currentPage;
      return this.pages[currentPage]?.customText || {};
    },
    getCurrentSavedText() {
      const currentPage = Alpine.store("viewState").currentPage;
      return this.pages[currentPage]?.savedText || {};
    },
    getCurrentCsvColumns() {
      const currentPage = Alpine.store("viewState").currentPage;
      return this.pages[currentPage]?.csvColumns || {};
    },
    pages: {
      1: {
        csvColumns: {},
        customText: {},
        savedText: {},
      },
    },
    clear() {
      this.pages = {
        1: { csvColumns: {}, customText: {}, savedText: {} },
      };
    },
    resolveSavedText(value) {
      if (value == null) return "";
      if (value === "__today") {
        return new Date().toLocaleDateString("en-US");
      }
      const entry = CUSTOM_SYMBOLS[value];
      return entry ? entry.textContent : value;
    },
    resolveSavedTextLabel(key) {
      const entry = CUSTOM_SYMBOLS[key];
      return entry ? entry.label : key;
    },
    saveToIDB() {
      // saveLocData();
    },
    colSel(colIdx) {
      const pgs = Object.values(this.pages);
      return pgs.some((page) =>
        Object.values(page.csvColumns || {}).some(
          (col) => col.colIdx === colIdx,
        ),
      );
    },
    delIdx(idx) {
      if (!confirm("Delete this marker?")) return;

      for (const [pageNum, page] of Object.entries(this.pages)) {
        let obj = null;

        const strIdx = String(idx);
        const numIdx = Number(idx);

        if (page.customText?.[strIdx]) {
          obj = page.customText[strIdx];
          delete page.customText[strIdx];
        } else if (page.savedText?.[strIdx]) {
          obj = page.savedText[strIdx];
          delete page.savedText[strIdx];
        } else if (page.csvColumns?.[strIdx]) {
          obj = page.csvColumns[strIdx];
          delete page.csvColumns[strIdx];
        } else if (!isNaN(numIdx) && page.csvColumns?.[numIdx]) {
          // Fallback fallback if it was indexed directly as an evaluated primitive Number
          obj = page.csvColumns[numIdx];
          delete page.csvColumns[numIdx];
        }

        // Check spacing and trigger render
        if (obj && obj.spacing > 0) {
          queueUpdateRenderDoc(Number(pageNum));
        }
      }
    },
    delCurrIdx() {
      const selId = Alpine.store("viewState").selectId;
      if (!selId) return;
      this.delIdx(selId);
    },
    getSelected() {
      const selId = Alpine.store("viewState").selectId;
      if (!selId) return null;

      for (const page of Object.values(this.pages)) {
        if (page.customText?.[selId]) return page.customText[selId];
        if (page.savedText?.[selId]) return page.savedText[selId];
        if (page.csvColumns?.[selId]) return page.csvColumns[selId];
      }
      return null;
    },
    moveSelected(x, y) {
      const selObj = this.getSelected();
      if (!selObj) return;
      selObj.x = Math.max(0, selObj.x + x);
      selObj.y = Math.max(0, selObj.y + y);
      if (selObj.spacing > 0) {
        queueUpdateRenderDoc();
      }
    },
    adjustSelectedSpacing(adj) {
      const selObj = this.getSelected();
      if (!selObj) return;
      const oldSpacing = selObj.spacing || 0;
      selObj.spacing = Math.max(0, oldSpacing + adj);
      Alpine.store("fontState").selectedSpacing = selObj.spacing;

      if (oldSpacing > 0 && selObj.spacing === 0) {
        forceQueueUpdateRenderDoc();
      } else if (oldSpacing !== selObj.spacing) {
        queueUpdateRenderDoc();
      }
    },
    adjustSelectedSize(adj) {
      const selObj = this.getSelected();
      if (!selObj) return;
      selObj.size = Math.max(0, (selObj.size || 12) + adj);
      Alpine.store("fontState").selectedSize = selObj.size;
    },
    cycleFont() {
      const selObj = this.getSelected();
      const selType = Alpine.store("viewState").selectType;
      if (!selObj || selType === "checkmark") return;

      const fonts = ["_normal", "_times", "_monospace", "_signature"];
      const currentFontIndex = fonts.findIndex((f) => f === selObj.font);
      if (currentFontIndex === -1) {
        selObj.font = "_normal";
        return;
      }
      const nextIndex = (currentFontIndex + 1) % fonts.length;
      selObj.font = fonts[nextIndex];
    },
  });

  // ====================== MODAL STORE ======================
  Alpine.store("modal", {
    isOpen: false,
    open() {
      this.isOpen = true;
    },
    close() {
      this.isOpen = false;
    },
    showDialog(dialogEl) {
      this.open();
      if (dialogEl && typeof dialogEl.showModal === "function") {
        dialogEl.showModal();
      }
    },
    closeDialog(dialogEl) {
      this.close();
      if (dialogEl && typeof dialogEl.close === "function") {
        dialogEl.close();
      }
    },
  });

  // ====================== VIEW STATE STORE ======================
  Alpine.store("viewState", {
    currentPage: 0,
    selectType: "",
    selectId: null,
    savedTextSelection: "__B_RoutingNumber",
    exportSingle: true,
    exportRasterize: false,
    exportJson: false,

    clear() {
      this.currentPage = 0;
      this.selectType = "";
      this.selectId = null;
      this.savedTextSelection = "";
      this.exportSingle = true;
      this.exportRasterize = false;
      this.exportJson = true;
    },
    selectedItem() {
      const page = Alpine.store("locData").pages[this.currentPage];
      if (!page || !this.selectId) return null;
      return (
        page.customText[this.selectId] ||
        page.savedText[this.selectId] ||
        page.csvColumns[this.selectId] ||
        null
      );
    },
    selectColumn(colIdx) {
      this.selectType = "column";
      this.selectId = colIdx;
      const el = document.querySelector(
        `.loc-data-el[data-col-idx="${colIdx}"]`,
      );
      if (el?.dataset?.id) {
        this.selId(el.dataset.id);
      }
    },
    selId(id) {
      this.selectType = "locData-el";
      this.selectId = id;
    },
    exportJsonToggle() {
      this.exportJson = !this.exportJson;
      if (this.exportJson) this.exportSingle = false;
    },
    exportSingleToggle() {
      this.exportSingle = !this.exportSingle;
      if (this.exportJson) this.exportJson = false;
    },
    exportSingleSet(bool = false) {
      this.exportSingle = bool;
      if (this.exportJson) this.exportJson = false;
    },
  });

  // ====================== FONT STATE STORE ======================
  Alpine.store("fontState", {
    selectedFont: "_normal",
    selectedSize: 12,
    selectedSpacing: 0,
    selX: 0,
    selY: 0,
    get selectedFontParsed() {
      return parseFont(this.selectedFont);
    },
  });

  // ====================== LOGBOX STORE ======================
  Alpine.store("logbox", {
    output: "",
    status: "ok",
    setError(msg) {
      this.output += `! ${msg}\n`;
      this.status = "error";
    },
    clear() {
      this.output = "";
      this.status = "ok";
    },
    add(msg) {
      this.output += `${msg}\n`;
    },
    setupScroll(element) {
      this.$watch("output", () => {
        Alpine.nextTick(() => {
          element.scrollTop = element.scrollHeight;
        });
      });
    },
  });

  // ====================== PDF STATE STORE ======================
  Alpine.store("pdfState", {
    pdfBytes: null,
    pdfPages: 0,
    pdfName: null,
    clear() {
      this.pdfBytes = null;
      this.pdfPages = 0;
      this.pdfName = null;
    },
  });

  // ====================== CSV STATE STORE ======================
  Alpine.store("csvState", {
    csvData: [],
    csvName: "",
    fileNameCols: new Set(),
    sendData: new Set(),

    isFileNameCol(colIdx) {
      return this.fileNameCols.has(colIdx);
    },
    isSendDataCol(colIdx) {
      return this.sendData.has(colIdx);
    },
    getPreviewRows() {
      if (!this.csvData || this.csvData.length <= 1) return [];
      return this.csvData.slice(1, Math.min(3, this.csvData.length));
    },

    toggleFileNameCol(colIdx) {
      this.fileNameCols.has(colIdx)
        ? this.fileNameCols.delete(colIdx)
        : this.fileNameCols.add(colIdx);
    },
    toggleSendData(colIdx) {
      this.sendData.has(colIdx)
        ? this.sendData.delete(colIdx)
        : this.sendData.add(colIdx);
    },
    getSampleRow(colIdx) {
      const firstRowData = this.csvData[1]?.[colIdx];
      return firstRowData === null || firstRowData === ""
        ? `${this.csvData[0][colIdx]}`
        : firstRowData;
    },
    clear() {
      this.csvData = [];
      this.csvName = "";
      this.fileNameCols.clear();
    },
    copyColumn(colIdx, newHeader = null) {
      if (!confirm("Copy column?") || !this.csvData.length) return;
      this.csvData.forEach((row, idx) => {
        const value = idx === 0 && newHeader !== null ? newHeader : row[colIdx];
        row.push(value);
      });
    },
  });

  // ====================== CSV EDIT MODAL STORE ======================
  Alpine.store("csvEditModal", {
    showModal: false,
    originalData: [],
    headers: [],
    dataRows: [],
    changedCells: new Set(),
    changedHeaders: new Set(),

    open() {
      this.showModal = true;
      this.loadData();
    },
    close() {
      this.showModal = false;
    },
    loadData() {
      const csvData = Alpine.store("csvState").csvData;
      if (!csvData?.length) return;
      this.originalData = JSON.parse(JSON.stringify(csvData));
      this.headers = [...csvData[0]];
      this.dataRows = csvData.slice(1).map((row) => [...row]);
      this.changedCells.clear();
      this.changedHeaders.clear();
    },
    updateHeader(colIdx, newValue) {
      this.headers[colIdx] = newValue;
      this.originalData[0][colIdx] !== newValue
        ? this.changedHeaders.add(colIdx)
        : this.changedHeaders.delete(colIdx);
    },
    updateCell(rowIdx, colIdx, newValue) {
      this.dataRows[rowIdx][colIdx] = newValue;
      const key = `${rowIdx}-${colIdx}`;
      this.originalData[rowIdx + 1][colIdx] !== newValue
        ? this.changedCells.add(key)
        : this.changedCells.delete(key);
    },
    isHeaderChanged(colIdx) {
      return this.changedHeaders.has(colIdx);
    },
    isCellChanged(rowIdx, colIdx) {
      return this.changedCells.has(`${rowIdx}-${colIdx}`);
    },
    addNewColumn() {
      const colName = prompt("Enter new column name:");
      if (!colName) return;
      this.headers.push(colName);
      this.dataRows.forEach((row) => row.push(""));
      this.changedHeaders.add(this.headers.length - 1);
    },
    addNewRow() {
      this.dataRows.push(new Array(this.headers.length).fill(""));
    },
    deleteRow(rowIdx) {
      if (confirm("Delete this row?")) this.dataRows.splice(rowIdx, 1);
    },
    revertChanges() {
      if (confirm("Revert all changes?")) this.loadData();
    },
    saveChanges() {
      Alpine.store("csvState").csvData = [this.headers, ...this.dataRows];
      this.changedCells.clear();
      this.changedHeaders.clear();
      alert("Changes saved!");
      this.close();
    },
  });

  // ====================== MENU STATE STORE ======================
  Alpine.store("menuState", {
    openMenus: { 1: true, 2: true, 3: true, 4: true },
    open(id) {
      this.openMenus[id] = true;
    },
    close(id) {
      this.openMenus[id] = false;
    },
    toggle(id) {
      this.openMenus[id] = !this.openMenus[id];
    },
    isOpen(id) {
      return !!this.openMenus[id];
    },
    clear() {
      this.openMenus = {};
    },
    openAll() {
      this.openMenus = { 1: true, 2: true, 3: true, 4: true, 5: true };
    },
    closeAll() {
      this.openMenus = {};
    },
  });

  Alpine.data("pdfNavigation", () => ({
    prevPage() {
      prevPage();
    },
    nextPage() {
      nextPage();
    },
    removeCurrentPage() {
      removeCurrentPage();
    },
    refreshPage() {
      refreshPage();
    },
  }));

  Alpine.data("pdfActions", () => ({
    generateAndExportPDFs() {
      generateAndExportPDFs();
    },
  }));

  Alpine.data("fileActions", () => ({
    uploadPDF() {
      uploadPDF();
    },
    clearFiles() {
      clearFiles();
    },
    uploadCSV() {
      uploadCSV();
    },
  }));

  Alpine.data("markerData", () => ({
    clearAllMarkers() {
      clearAllMarkers();
    },
    showDownloadModal() {
      showDownloadModal();
    },
    uploadMarkers() {
      uploadMarkers();
    },
  }));

  Alpine.data("downloadModal", () => ({
    downloadHeadersOnlyCSV_dm() {
      downloadHeadersOnlyCSV();
    },
    downloadMarkers_dm() {
      downloadMarkers();
    },
    generateAndExportPDFs_dm(isSingle) {
      Alpine.store("viewState").exportSingleSet(isSingle);
      generateAndExportPDFs();
    },
    closeModal_dm() {
      document.getElementById("downloadModal").close();
    },
  }));

  // ====================== CSV COLUMNS LIST COMPONENT ======================
  Alpine.data("csvColumnsList", () => ({
    // Returns the class object for the main card
    getCardClass(colIdx) {
      return {
        select: Alpine.store("viewState").selectId == colIdx,
        "loc-data-exists": Alpine.store("locData").colSel(colIdx),
      };
    },
    // Returns the toggle class for the "+File Name" button
    getFileNameClass(colIdx) {
      return Alpine.store("csvState").isFileNameCol(colIdx)
        ? "file-name-select"
        : "";
    },
    // Returns the toggle class for the "+Send Data" button
    getSendDataClass(colIdx) {
      return Alpine.store("csvState").isSendDataCol(colIdx)
        ? "send-data-select"
        : "";
    },
  }));

  // ====================== CUSTOM CARDS LIST COMPONENT ======================
  Alpine.data("customCardsList", () => ({
    // Resolves layout class safely without inline HTML object syntax
    getTextColClass() {
      const collapsed =
        Alpine.store("viewState").rightcollapsed || window.rightcollapsed;
      return !collapsed ? "col-6" : "";
    },

    // Resolves display state safely
    getMutedDivClass() {
      const collapsed =
        Alpine.store("viewState").rightcollapsed || window.rightcollapsed;
      return collapsed ? "d-none" : "";
    },

    // Formats the details string using standard JS string concatenation
    getItemDetails(item) {
      const font = item.font || "Normal";
      const size = item.size || 12;
      return font + ", " + size + "px";
    },
  }));

  // ====================== DRAGGABLE ITEM COMPONENT ======================
  Alpine.data("draggableItem", () => ({
    dragging: false,
    startX: 0,
    startY: 0,

    // Computes class object natively
    getItemClass(item, id) {
      return {
        select: Alpine.store("viewState").selectId == id,
        "spacing-yes": item.spacing > 0,
      };
    },

    // Computes styles natively as a clean object (perfectly supported in CSP)
    getItemStyle(item) {
      return {
        position: "absolute",
        pointerEvents: "auto",
        left: item.x + "px",
        top: item.y + "px",
        fontFamily: item.font,
        fontSize: item.size + "px",
        letterSpacing: item.spacing ? item.spacing / 2 + "px" : "0px",
      };
    },

    // Handles mousedown actions
    onMouseDown(event, item, id) {
      this.dragging = true;
      this.startX = event.clientX - item.x;
      this.startY = event.clientY - item.y;
      Alpine.store("viewState").selId(id);
    },

    // Handles mousemove dragging limits safely
    onMouseMove(event, item) {
      if (!this.dragging) return;
      item.x = Math.max(0, event.clientX - this.startX);
      item.y = Math.max(0, event.clientY - this.startY);

      if (item.spacing > 0) {
        queueUpdateRenderDoc(Alpine.store("viewState").currentPage);
      }
    },

    // Handles mouseup
    onMouseUp() {
      this.dragging = false;
    },
  }));

  // ====================== COLUMN BUILDER COMPONENT ======================
  Alpine.data("columnBuilder", () => ({
    builderParts: [],
    addColumn(colIdx) {
      this.builderParts.push({ type: "column", colIdx: colIdx });
    },
    addInput() {
      this.builderParts.push({ type: "input", text: " " });
    },
    submit() {
      if (this.builderParts.length === 0) {
        alert("Please add at least one column or input");
        return;
      }

      addConstructedColumn(this.builderParts);

      // Close modal and reset
      this.$data.showCreateColumnModal = false;
      this.builderParts = [];
    },
    getOptionText(col, idx) {
      return Number(idx) + 1 + " - " + col;
    },

    // 2. Handles the selection and cleanly resets the dropdown
    handleColumnSelect(event) {
      const val = event.target.value;
      if (val !== "") {
        this.addColumn(val);
        event.target.value = ""; // Reset dropdown selection
      }
    },
  }));

  // ====================== PDF CANVAS DATA ENGINE ======================
  Alpine.data("pdfCanvas", () => ({
    init() {
      this.$watch("$store.viewState.currentPage", () => {
        queueUpdateRenderDoc();
      });
    },
    handleCanvasClick(e) {
      const canvas = e.currentTarget;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const ld = Alpine.store("locData");
      const vs = Alpine.store("viewState");
      const fs = Alpine.store("fontState");

      const selType = vs.selectType;
      const pageNum = vs.currentPage;

      // Handle custom text creation selection swaps cleanly
      if (selType === "locData-el") {
        vs.selectType = "customText";
        return;
      }

      // Safe evaluation fallback without altering store state downstream
      const targetFont =
        fs.selectedFont === "_symbol"
          ? "_normal"
          : fs.selectedFont || "_normal";

      let payload = {
        x: x,
        y: y,
        stageW: canvas.width,
        stageH: canvas.height,
        font: targetFont,
        size: fs.selectedSize,
        spacing: fs.selectedSpacing,
      };

      verifyPage(pageNum);
      let newId = generateUniqueId();

      switch (selType) {
        case "checkmark":
          payload.key = "__checkmark";
          payload.text = ld.resolveSavedText("__checkmark");
          payload.font = "_symbol";
          payload.size = 25;
          payload.spacing = 0;
          ld.pages[pageNum].savedText[newId] = payload;
          break;
        case "today":
          const now = new Date();
          payload.text = `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()}`;
          ld.pages[pageNum].customText[newId] = payload;
          break;
        case "savedText":
          const ky = vs.savedTextSelection;
          payload.key = ky;
          payload.text = ld.resolveSavedText(ky);
          ld.pages[pageNum].savedText[newId] = payload;
          break;
        case "column":
          newId = String(vs.selectId);
          payload.colIdx = vs.selectId;
          ld.pages[pageNum].csvColumns[newId] = payload;
          break;
        case "customText":
          let customTxt = prompt("Enter custom text:");
          if (!customTxt || customTxt.trim() === "") return;
          payload.text = customTxt;
          ld.pages[pageNum].customText[newId] = payload;
          break;
      }

      // Safeguard column selections from getting overwritten incorrectly to type 'locData-el'
      if (selType === "column") {
        vs.selectId = newId;
      } else {
        vs.selId(newId);
      }

      if (payload.spacing > 0) {
        queueUpdateRenderDoc();
      }
    },
  }));

  // ====================== CONDITIONAL CHECKMARK STORE ======================
  Alpine.store("conditionalCheckmark", {
    selectedColumn: null,
    selectedColumnIndex: null,
    breakdown: [],
    rowStates: {},
    inputValues: {},

    reset() {
      this.selectedColumn = null;
      this.selectedColumnIndex = null;
      this.breakdown = [];
      this.rowStates = {};
      this.inputValues = {};
    },
    setColumn(columnName, columnIndex) {
      this.selectedColumn = columnName;
      this.selectedColumnIndex = columnIndex;
      this.breakdown = getBreakdown(columnIndex);
      this.rowStates = {};
      this.inputValues = {};

      this.breakdown.forEach((item) => {
        const key = String(item.value);
        this.rowStates[key] = "checkmark";
      });
    },
    setRowState(value, state) {
      this.rowStates[value] = state;
    },
    setInputValue(value, text) {
      this.inputValues[value] = text;
    },
    isCheckmark(value) {
      return this.rowStates[value] === "checkmark";
    },
    isInput(value) {
      return this.rowStates[value] === "input";
    },
  });
});

// ====================== EFFECT SYNCHRONIZER ======================
document.addEventListener("alpine:initialized", () => {
  Alpine.effect(() => {
    // 1. This reactively tracks changes to the store's output
    const output = Alpine.store("logbox").output;
    // 2. Grab the logbox element directly from the DOM using native JS
    const logboxElement = document.getElementById("logbox");
    // 3. Scroll it down!
    if (logboxElement) {
      Alpine.nextTick(() => {
        logboxElement.scrollTop = logboxElement.scrollHeight;
      });
    }
  });

  window.locData = Alpine.store("locData");
  window.viewState = Alpine.store("viewState");
  window.pdfState = Alpine.store("pdfState");
  window.fontState = Alpine.store("fontState");

  let prevFont = null;
  let prevSize = null;
  let prevSpacing = null;

  // Save current snapshot after 1/2 sec of inactivity
  let saveTimer;
  Alpine.effect(() => {
    const ld = Alpine.store("locData");
    const snapshot = JSON.stringify(ld.pages);
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => saveLocData(), 500);
  });

  Alpine.effect(() => {
    const vs = Alpine.store("viewState");
    const fs = Alpine.store("fontState");
    const ld = Alpine.store("locData");

    if (!vs.selectId) return;
    const page = ld.pages[vs.currentPage];
    if (!page) return;

    const el =
      page.customText[vs.selectId] ||
      page.savedText[vs.selectId] ||
      page.csvColumns[vs.selectId];
    if (!el) return;

    // Direct synchronization conditional checks prevent recursive state updates
    if (
      fs.selectedFont !== el.font ||
      fs.selectedSize !== el.size ||
      fs.selectedSpacing !== el.spacing
    ) {
      fs.selectedFont = el.font || "_normal";
      fs.selectedSize = el.size || 12;
      fs.selectedSpacing = el.spacing || 0;
    }

    el.font = fs.selectedFont;
    el.size = fs.selectedSize;
    el.spacing = fs.selectedSpacing;

    const fontChanged =
      el.font !== prevFont ||
      el.size !== prevSize ||
      el.spacing !== prevSpacing;

    if (el.spacing > 0 && fontChanged) {
      queueUpdateRenderDoc(vs.currentPage);
    }

    prevFont = el.font;
    prevSize = el.size;
    prevSpacing = el.spacing;
  });
});

// ====================== CSP COMPATIBILITY HELPERS ======================

// 1. Menu State helpers
window.setupLogboxScroll = function (element) {
  // Since this runs in a real .js file, we can use normal JS, arrow functions,
  // and closures without triggering any CSP issues!
  Alpine.watch(Alpine.store("logbox"), "output", () => {
    Alpine.nextTick(() => {
      element.scrollTop = element.scrollHeight;
    });
  });
};
