# Add Selvedge Master Dropdown and Verify Calculations

## Summary

The main source code has a **selvedge dropdown with 57 pre-defined selvedge options** and an auto-fill function that populates selvedge-related fields when a selvedge is selected. Our current system only has a basic text input field. This plan adds the dropdown functionality and verifies all calculations match the main source code.

## Findings from Main Source Code

### 1. Selvedge Dropdown
**Location**: Lines 2687-2862 in `main source code.txt`

The main source code has a `<select>` dropdown with 57 selvedge options including:
- "21ST CENTURY FABRICS 100% GIZA MADE IN JAPAN (YING YANG)"
- "BENZ-053-FINEST GIZA COTTON LUXURY ITALINO CLOTHING"
- "100% COTTON - 70*70 LEA SLUB - ARMANI"
- ...and 54 more options

### 2. Auto-Fill Function
**Location**: Lines 4617-4639 in `main source code.txt`

```javascript
function getsalvagedetails(salvageid){
  // Makes AJAX call to backend
  // Auto-fills: dents, selvedgeEnds, endsPerDents, totalSelvedge, selvedgeWidth
  // Then calls getselvedgeEnds() to recalculate
}
```

### 3. Selvedge Calculation Logic
**Location**: Lines 4460-4500 in `main source code.txt`

Two calculation types based on `selvedgeWidthType`:
- **Type 0 (Simple)**: `selvedgeEnds = dents × endsPerDents`
- **Type 1 (Width-based)**: `dents = CEILING((reed ÷ 2 ÷ 25.4) × selvedgeWidth)` then `selvedgeEnds = dents × endsPerDents × 2`

---

## Proposed Changes

### 1. Backend: Create Selvedge Master Data

#### [NEW] Create `SelvedgeMaster.gs`

Add a new file with selvedge master data and retrieval functions:

```javascript
// Selvedge Master Data
function getSelvedgeMasterData() {
  return [
    {id: 1, name: "21ST CENTURY FABRICS 100% GIZA MADE IN JAPAN (YING YANG)", dents: 0, ends: 0, endsPerDent: 0, width: 0},
    {id: 2, name: "21ST CENTURY FABRICS 100% COTTON 100-100 SHAHZADA LAWN", dents: 0, ends: 0, endsPerDent: 0, width: 0},
    // ... all 57 options
  ];
}

function getSelvedgeDetails(selvedgeId) {
  var selvedges = getSelvedgeMasterData();
  var selvedge = selvedges.find(function(s) { return s.id == selvedgeId; });
  return selvedge || null;
}
```

### 2. Frontend: Update HTML Form

#### [MODIFY] [Sortmasterform.html](file:///c:/Users/edmmo/Desktop/RTWE%20Enquiry/sort%20master%20system%202026/Sortmasterform.html#L840-L843)

**Current** (line 840-843):
```html
<select id="selvedgeId">
  <option value="">Select...</option>
  <!-- Options populated by JavaScript from selvedgeMasterData -->
</select>
```

**Change to**:
```html
<select id="selvedgeId" onchange="getSelvedgeDetails(this.value)">
  <option value="">Select...</option>
  <!-- Options will be populated from backend selvedge master data -->
</select>
```

### 3. Frontend: Add Auto-Fill Function

#### [MODIFY] [Sortmasterform.html](file:///c:/Users/edmmo/Desktop/RTWE%20Enquiry/sort%20master%20system%202026/Sortmasterform.html#L1200-L1250)

Add JavaScript function to auto-fill selvedge fields:

```javascript
// Get selvedge details and auto-fill fields
function getSelvedgeDetails(selvedgeId) {
  if (!selvedgeId) return;
  
  google.script.run
    .withSuccessHandler(function(selvedge) {
      if (selvedge) {
        document.getElementById('dentsWidth').value = selvedge.width || 0;
        document.getElementById('endsPerDent').value = selvedge.endsPerDent || 0;
        document.getElementById('selvedgeEnds').value = selvedge.ends || 0;
        
        // Trigger auto-calculation
        triggerAutoCalculate();
      }
    })
    .withFailureHandler(function(error) {
      console.error('Error loading selvedge details:', error);
    })
    .getSelvedgeDetails(selvedgeId);
}
```

### 4. Frontend: Populate Dropdown on Load

#### [MODIFY] [Sortmasterform.html](file:///c:/Users/edmmo/Desktop/RTWE%20Enquiry/sort%20master%20system%202026/Sortmasterform.html#L1177-L1210)

Update `loadMasterData()` function to load selvedge data:

```javascript
// Load Selvedge Master
google.script.run
  .withSuccessHandler(function(data) {
    selvedgeMasterData = data;
    populateSelvedgeDropdown();
    checkAllLoaded();
  })
  .withFailureHandler(function(error) {
    console.error('Error loading selvedge master:', error);
    checkAllLoaded();
  })
  .getSelvedgeMasterData();

function populateSelvedgeDropdown() {
  var select = document.getElementById('selvedgeId');
  selvedgeMasterData.forEach(function(selvedge) {
    var option = document.createElement('option');
    option.value = selvedge.id;
    option.textContent = selvedge.name;
    select.appendChild(option);
  });
}
```

---

## Calculation Verification

Need to compare these calculations between main source code and our implementation:

1. **Reed Space**: `width + extraWidth` (Type 0) ✅ Already fixed
2. **Final Reed**: `(reed × denting) ÷ 2` ✅ Already correct
3. **Total Ends**: `reedSpace × finalReed` ✅ Already correct
4. **Selvedge Ends** (Type 0): `dents × endsPerDents` ✅ Already correct
5. **Selvedge Ends** (Type 1): `CEILING((reed ÷ 2 ÷ 25.4) × selvedgeWidth) × endsPerDents × 2` ✅ Already correct
6. **Warp Weight**: `(ends × 0.0005905) ÷ englishCount` - Need to verify
7. **Weft Weight**: `(reedSpace × picks × 0.0005905) ÷ englishCount` - Need to verify

---

## Testing Plan

1. **Test Selvedge Dropdown**:
   - Verify all 57 options appear in dropdown
   - Select different selvedges and verify auto-fill works
   
2. **Test Selvedge Calculations**:
   - Test Type 0 (simple) calculation
   - Test Type 1 (width-based) calculation
   - Verify "Ends With Selvedge" = Total Ends + Selvedge Ends

3. **Verify All Calculations**:
   - Create a test Sort Master with known values
   - Compare results with main source code calculations
   - Document any discrepancies
