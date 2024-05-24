const pattern = /^\[([A-Za-z]+(?:,\s*[A-Za-z]+)*)\]/;
const allAspects = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
const aspectIxMap = {
  'N' : [15, 0, 1],
  'NE': [1, 2, 3],
  'E' : [3, 4, 5],
  'SE': [5, 6, 7],
  'S' : [7, 8, 9],
  'SW': [9, 10, 11],
  'W' : [11, 12, 13],
  'NW': [13, 14, 15]
};

function debug() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName('Aragats - bulletin');
  const range = sheet.getRange(1, 2);
  onEdit({range: range});
}

function onEdit(e) { 
  const range = e.range;

  if (range.getRow() != 1 || range.getColumn() != 2 || range.getSheet().getSheetName() != 'Aragats - bulletin')
    return;

  const editedValue = range.getValue();
  console.log(editedValue);

  var targetColumn = getTargetColumn(editedValue);
  if (targetColumn == null) {
    console.log('The values for date ' + editedValue + ' were not found');
    return;
  }

  var bulletin = buildAvalancheBulletin(targetColumn);

  writeAvalancheBulletin(bulletin);
}

function writeAvalancheBulletin(bulletin) {
  console.log('Writing the bulletin...');

  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  // Get the specific sheet by name
  const sheetName = 'Aragats - bulletin'; // Replace with the name of your sheet
  const sheet = spreadsheet.getSheetByName(sheetName);
  const range = sheet.getRange(2, 14, 16 * 6, 2);
  const values = [];

  for (let i = 0; i < 16 * 6; ++i) {
    values.push([0,0]);
  }

  for (let avTypeName in bulletin) {
    const avType = bulletin[avTypeName];

    for (let aspect in aspectIxMap) {
      const ha = avType['highAlpine'][aspect];
      const a = avType['alpine'][aspect];

      const outer = a ? 2: 0;
      const inner = ((ha && !a) || (a && !ha)) ? 1 : 0;

      const ixs = aspectIxMap[aspect];

      for (let ix of ixs) {
        if (values[ix + avType.offset][0] == 0)
          values[ix + avType.offset][0] = inner;
        
        if (values[ix + avType.offset][1] == 0)
          values[ix + avType.offset][1] = outer;
      }
    }
  }

  range.setValues(values);
}

function buildAvalancheBulletin(dateCol) {
  console.log('Building the bulletin...');

  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  // Get the specific sheet by name
  const sheetName = 'Aragats - overview'; // Replace with the name of your sheet
  const sheet = spreadsheet.getSheetByName(sheetName);

  const range = sheet.getRange(13, dateCol, 16, 1);
  const values = range.getValues();
  const notes = range.getNotes();

  const res = {
    'stormSlab': {
      'highAlpine': getAspects(values[0][0], notes[0][0]),
      'alpine': getAspects(values[8][0], notes[8][0]),
      'offset': 0
    },
    'windSlab': {
      'highAlpine': getAspects(values[1][0], notes[1][0]),
      'alpine': getAspects(values[9][0], notes[9][0]),
      'offset': 16
    },
    'wetSlab': {
      'highAlpine': getAspects(values[2][0], notes[2][0]),
      'alpine': getAspects(values[10][0], notes[10][0]),
      'offset': 32
    },
    'persistentSlab': {
      'highAlpine': getAspects(values[3][0], notes[3][0]),
      'alpine': getAspects(values[11][0], notes[11][0]),
      'offset': 48
    },
    'wetSluff': {
      'highAlpine': getAspects(values[4][0], notes[4][0]),
      'alpine': getAspects(values[12][0], notes[12][0]),
      'offset': 64
    },
    'drySluff': {
      'highAlpine': getAspects(values[5][0], notes[5][0]),
      'alpine': getAspects(values[13][0], notes[13][0]),
      'offset': 80
    }
  };

  return res;
}

function getAspects(value, aspectsStr) {
  let res = {};

  let isPresent = value > 0;
  const match = aspectsStr.match(pattern);
  let aspects = null

  if (match) {
    aspects = new Map(match[1].split(',').map(word => [word.trim(),true])); // Extract and trim individual words
  }

  for (let aspect of allAspects) {
    res[aspect] = isPresent && (!aspects || aspects.has(aspect));
  }

  return res;
}

function getTargetColumn(date) {
  // Get the active spreadsheet
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  // Get the specific sheet by name
  const sheetName = 'Aragats - overview'; // Replace with the name of your sheet
  const sheet = spreadsheet.getSheetByName(sheetName);
  var datesRange = sheet.getRange(1, 1, 1, 100);
  
  // Get all values in the sheet
  const dates = datesRange.getValues();

  // Iterate through each row
  for (let i = 0; i < dates.length; i++) {
    for (let j = 0; j < dates[i].length; j++) {
      // Check if the cell contains the edited value
      if (dates[i][j] == date) {
        // Log the column number (1-indexed)
        console.log('Value found in column: ' + (j + 1));
        // Return the column number
        return j + 1;
      }
    }
  }

  return null;
}
