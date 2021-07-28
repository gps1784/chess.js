/**
 * ChessJS - used to create a new <canvas> *inside* of existing <div>.
 * If you want to use an existing <canvas> object, use ChessJS.useCanvas().
 * TODO:
 * - Add the option(?) for a double-buffer with two stacked canvases
 */
function ChessJS(canvasParentID, boardState=null) {
  this.rowNames = ["8","7","6","5","4","3","2","1"];
  this.colNames = ["A","B","C","D","E","F","G","H"];
  /* setup target element */
  this.target = document.getElementById(canvasParentID);
  /* setup table element */
  this.canvas = document.createElement("canvas");
  this.canvas.classList = "chess-js-canvas";
  this.canvas.width     = this.target.offsetWidth;
  this.canvas.height    = this.target.offsetWidth;
  this.canvas.context   = this.canvas.getContext("2d");
  /* disable imageSmoothing because we want the pixel art, for now */
  this.canvas.context.imageSmoothingEnabled       = false;
  this.canvas.context.mozImageSmoothingEnabled    = false;
  this.canvas.context.webkitImageSmoothingEnabled = false;
  /* set default board colors */
  this.palette = ChessJS.COLOR_PALETTES["green"];
  this.xHover = null;
  this.yHover = null;
  this.xDown  = null;
  this.yDown  = null;
  let self = this;
  let segmentSize = this.canvas.width / 9;

  this.createLabels();
  this.createBoard();
  this.setBoard();

  this.canvas.addEventListener('mousemove', e => {
    let xNew = e.offsetX;
    let yNew = e.offsetY;
    if (
      (Math.floor(xNew / segmentSize) != Math.floor(self.xHover / segmentSize)) ||
      (Math.floor(yNew / segmentSize) != Math.floor(self.yHover / segmentSize))
    ) {
      self.xHover = e.offsetX;
      self.yHover = e.offsetY;
      this.createBoard();
      this.setBoard();
    }
    self.xHover = e.offsetX;
    self.yHover = e.offsetY;
  });

  this.canvas.addEventListener('mousedown', e => {
    self.xDown = e.offsetX;
    self.yDown = e.offsetY;
    this.createBoard();
    this.setBoard();
    console.debug("mousedown @", self.xDown, self.yDown);
  });

    this.canvas.addEventListener('mouseup', e => {
      self.xDown = null;
      self.yDown = null;
      this.createBoard();
      this.setBoard();
      console.debug("mouseup");
    });

  /* create table, fill, and return to user */
  this.target.appendChild(this.canvas);
  return this;
};

ChessJS.COLOR_PALETTES = {
  "green": {
    "light": {
      "normal": "#809988",
      "hover":  "#4E8199",//"#526658",
      "down":   "#998A4E",//"#998880",
    },
    "dark": {
      "normal": "#607768",
      "hover":  "#4E8199",//"#36443B",
      "down":   "#998A4E",
    },
  },
};

ChessJS.prototype.createLabels = function () {
  let segmentSize = this.canvas.width / 9;
  /* setup text around the border of the board */
  this.canvas.context.font = "40px Arial";
  this.canvas.context.textAlign = "center";
  this.canvas.context.textBaseline = "middle";
  /* "8", "7", "6", etc. down the rows */
  this.rowNames.forEach((rowName, idy) => {
    this.canvas.context.strokeText(rowName, segmentSize / 1.2, (idy+1.5) * segmentSize);
  });
  /* "A", "B", "C", etc. across the columns */
  this.colNames.forEach((colName, idx) => {
    this.canvas.context.strokeText(colName, (idx+1.5) * segmentSize, segmentSize / 1.2);
  });
};

ChessJS.prototype.createBoard = function () {
  /* draw the board (a group of rectangles) */
  this.rowNames.forEach((rowName, idy) => {
    this.colNames.forEach((colName, idx) => {
      this.createCell(idx, idy);
    });
  });
};

ChessJS.prototype.createCell = function (idx, idy) {
  let segmentSize = this.canvas.width / 9;
  let x = (idx+1) * segmentSize;
  let y = (idy+1) * segmentSize;
  let colorState = "normal";

  /* calculate whether to use a different colorState */
  if (
    (this.xDown != null) &&
    (this.yDown != null) &&
    (this.xDown > x) &&
    (this.xDown < x + segmentSize) &&
    (this.yDown > y) &&
    (this.yDown < y + segmentSize)) {
      colorState = "down";
  } else if (
    (this.xHover > x) &&
    (this.xHover < x + segmentSize) &&
    (this.yHover > y) &&
    (this.yHover < y + segmentSize)) {
      colorState = "hover";
  }
  /* this creates an two-tone XOR pattern across the rows and columns */
  if ((idx + idy) % 2 === 0) {
    this.canvas.context.fillStyle = this.palette["light"][colorState];
  } else {
    this.canvas.context.fillStyle = this.palette["dark"][colorState];
  }
  this.canvas.context.fillRect(x, y, segmentSize, segmentSize);
};

ChessJS.prototype.clearCell = function (col, row) {
  let segmentSize = this.canvas.width / 9;
  let idx = this.convertColToIndex(col);
  let idy = this.convertRowToIndex(row);
  this.createCell(idx, idy);
  return this;
};

ChessJS.prototype.setCell = function (col, row, color, piece) {
  let segmentSize = this.canvas.width / 9;
  let context = this.canvas.context;
  let idx = this.convertColToIndex(col);
  let idy = this.convertRowToIndex(row);
  //console.debug(this.colNames[idx] + this.rowNames[idy], color, piece);
  var img  = document.createElement("img");
  img.src    = "assets/images/" + piece + "_" + color + ".png";
  img.alt    = color + " " + piece;
  img.title  = img.alt + " at " + this.colNames[idx] + this.rowNames[idy];
  img.onload = function() {
    context.drawImage(img, (idx+1) * segmentSize, (idy+1) * segmentSize, segmentSize, segmentSize);
  }
  return this;
};

ChessJS.prototype.setBoard = function () {
    // TODO: add parser
    this.setCell("A", 8, "black", "castle");
    this.setCell("B", 8, "black", "knight");
    this.setCell("C", 8, "black", "bishop");
    this.setCell("D", 8, "black", "queen");
    this.setCell("E", 8, "black", "king");
    this.setCell("F", 8, "black", "bishop");
    this.setCell("G", 8, "black", "knight");
    this.setCell("H", 8, "black", "castle");
    this.setCell("A", 7, "black", "pawn");
    this.setCell("B", 7, "black", "pawn");
    this.setCell("C", 7, "black", "pawn");
    this.setCell("D", 7, "black", "pawn");
    this.setCell("E", 7, "black", "pawn");
    this.setCell("F", 7, "black", "pawn");
    this.setCell("G", 7, "black", "pawn");
    this.setCell("H", 7, "black", "pawn");
    this.setCell("A", 2, "white", "pawn");
    this.setCell("B", 2, "white", "pawn");
    this.setCell("C", 2, "white", "pawn");
    this.setCell("D", 2, "white", "pawn");
    this.setCell("E", 2, "white", "pawn");
    this.setCell("F", 2, "white", "pawn");
    this.setCell("G", 2, "white", "pawn");
    this.setCell("H", 2, "white", "pawn");
    this.setCell("A", 1, "white", "castle");
    this.setCell("B", 1, "white", "knight");
    this.setCell("C", 1, "white", "bishop");
    this.setCell("D", 1, "white", "queen");
    this.setCell("E", 1, "white", "king");
    this.setCell("F", 1, "white", "bishop");
    this.setCell("G", 1, "white", "knight");
    this.setCell("H", 1, "white", "castle");
};

ChessJS.prototype.convertColToIndex = function (col) {
  let segmentSize = this.canvas.width / 9;
  if (isNaN(col)) {
    col = this.colNames.indexOf(col);
  } else {
    col = this.colName.indexOf(col.toString());
  }
  return col;
};

ChessJS.prototype.convertRowToIndex = function (row) {
  row = this.rowNames.indexOf(row.toString());
  return row;
};

//function ChessJS.useCanvas(canvasID) {};
