/**
 * ChessJS - used to create a new <canvas> *inside* of existing <div>.
 * If you want to use an existing <canvas> object, use ChessJS.useCanvas().
 * TODO:
 * - Add the option(?) for a double-buffer with two stacked canvases
 */

/* CONSTRUCTORS */

/* create a new canvas and board */
function ChessJS(canvas, boardState=null, w=null, h=null) {
  this.convert(); // binds the conversion functions for use
  this.rows = [null,'8','7','6','5','4','3','2','1',null];
  this.cols = [null,'A','B','C','D','E','F','G','H'];
  this.canvas  = canvas;
  this.context = this.canvas.getContext('2d');
  if (w != null) {
    this.canvas.width = w;
  }
  if (h != null) {
    this.canvas.height = h;
  }
  this.canvas.classList = 'chess-js-canvas';
  this.segmentSize = this.canvas.width / 9;
  /* disable imageSmoothing because we want the pixel art, for now */
  this.context.imageSmoothingEnabled       = false;
  this.context.mozImageSmoothingEnabled    = false;
  this.context.webkitImageSmoothingEnabled = false;
  /* set default board colors */
  this.palette = ChessJS.COLOR_PALETTES['green'];
  /* board state, mouse positions */
  this.board  = { turn: 'white', white: { canCastle: true}, black: { canCastle: true } };
  this.mouse  = {
    down: { hold: false, x: null, y: null, cell: null },
    hover: { x: null, y: null, cell: null }
  };
  this.drawLabels();
  this.setBoard(boardState);
  this.drawBoard();
  this.canvas.addEventListener('mousemove', this.mousemove.bind(this));
  this.canvas.addEventListener('mousedown', this.mousedown.bind(this));
  this.canvas.addEventListener('mouseup',   this.mouseup.bind(this));
  return this;
}; // function ChessJS();

/* initialize chess board on an existing canvas */
ChessJS.useCanvas = function(canvasID, boardState=null) {
  let canvas = document.getElementById(canvasID);
  let chess  = new ChessJS(canvas, boardState);
  return chess;
}; // function ChessJS.useCanvas()

/* initialize canvas, then chess board, insert, and return */
ChessJS.appendToParent = function(parentID, boardState=null) {
  let parent = document.getElementById(parentID);
  let canvas = document.createElement('canvas');
  let w = parent.offsetWidth;
  let h = parent.offsetWidth; // TODO: looks to big on large displays
  let chess  = new ChessJS(canvas, boardState, w, h);
  parent.appendChild(canvas);
  return chess;
}; // function ChessJS.appendToParent()

ChessJS.COLOR_PALETTES = {
  'green': {
    'light': {
      'normal': '#809988',
      'hover':  '#4E8199',//'#526658',
      'down':   '#998A4E',//'#998880',
    },
    'dark': {
      'normal': '#607768',
      'hover':  '#4E8199',//'#36443B',
      'down':   '#998A4E',
    },
  },
}; // ChessJS.COLOR_PALETTES

/* RENDERERS */

ChessJS.prototype.drawLabels = function () {
  /* you shouldn't need to run this function often */
  this.context.font = '40px Arial';
  this.context.textAlign = 'center';
  this.context.textBaseline = 'middle';
  /* '8', '7', '6', etc. down the rows */
  this.rows.forEach((row, idy) => {
    if (row != null) {
      this.context.strokeText(row, this.segmentSize / 1.2, (idy+0.5) * this.segmentSize);
    }
  });
  /* 'A', 'B', 'C', etc. across the columns */
  this.cols.forEach((col, idx) => {
    if (col != null) {
      this.context.strokeText(col, (idx+0.5) * this.segmentSize, this.segmentSize / 1.2);
    }
  });

}; // function ChessJS.prototype.drawLabels()

ChessJS.prototype.drawBoard = function () {
  this.rows.forEach((row, idy) => {
    this.cols.forEach((col, idx) => {
      if (row != null && col != null) {
        // TODO: this.drawCell => this.drawColRow
        this.drawCell(this.convert.ColRowToCell(col, row));
      }
    });
  });
  return this;
}; // function ChessJS.prototype.drawBoard()

ChessJS.prototype.drawCell = function (cell) {
  /* a shorthand for later */
  let context = this.context;
  let ss      = this.segmentSize;
  /* variable roundup, yeehaw */
  let xy    = this.convert.CellToXY(cell);
  let id    = this.convert.CellToIdxIdy(cell);
  let pc    = this.getCell(cell);
  let down  = this.mouse.down;
  let hover = this.mouse.hover;
  let x     = xy.x;
  let y     = xy.y;
  let idx   = id.idx;
  let idy   = id.idy;
  let state = 'normal'; // default, e.g. 'hover', 'down'
  /* determine color for background */
  /* TODO: add a cellIsMouseDown() and cellIsMouseHover(), plz jfc */
  if (
    (down.hold != false) &&
    (down.x > x) &&
    (down.x < x + ss) &&
    (down.y > y) &&
    (down.y < y + ss)) {
      state = 'down';
  } else if (
    (hover.cell != null) &&
    (hover.x > x) &&
    (hover.x < x + ss) &&
    (hover.y > y) &&
    (hover.y < y + ss)) {
      state = 'hover';
  }
  console.debug(cell, x, y, pc);
  /* this creates an two-tone XOR pattern across the rows and columns */
  if ((idx + idy) % 2 === 0) {
    this.context.fillStyle = this.palette['light'][state];
  } else {
    this.context.fillStyle = this.palette['dark'][state];
  }
  this.context.fillRect(x, y, ss, ss);
  /* render the sprite for the chess piece, if needed */
  if (pc != null) {
    let context = this.context;
    let img     = document.createElement('img');
    img.src     = 'assets/images/' + pc.piece + '_' + pc.color + '.png';
    img.onload  = function() {
      context.drawImage(img, idx * ss, idy * ss, ss, ss);
    } // img.onload
  }
  return this;
}; // function ChessJS.prototype.drawCell()

/* SETTERS */

ChessJS.prototype.clearCell = function (cell) {
  this.board[cell] = null;
  return this;
}; // function ChessJS.prototype.clearCell()

ChessJS.prototype.setCell = function (cell, color, piece) {
  let id = this.convert.CellToIdxIdy(cell);
  let cr = this.convert.CellToColRow(cell);
  this.board[cell] = {
    color: color,
    piece: piece,
    cell: cell,
    col: cr.col,
    row: cr.row,
    idx: id.idx,
    idy: id.idy,
  };
  return this;
}; // function ChessJS.prototype.setCell()

ChessJS.prototype.setBoard = function (boardState) {
  if (boardState === null) {
    this.setCell("A8", "black", "castle");
    this.setCell("B8", "black", "knight");
    this.setCell("C8", "black", "bishop");
    this.setCell("D8", "black", "queen");
    this.setCell("E8", "black", "king");
    this.setCell("F8", "black", "bishop");
    this.setCell("G8", "black", "knight");
    this.setCell("H8", "black", "castle");
    this.setCell("A7", "black", "pawn");
    this.setCell("B7", "black", "pawn");
    this.setCell("C7", "black", "pawn");
    this.setCell("D7", "black", "pawn");
    this.setCell("E7", "black", "pawn");
    this.setCell("F7", "black", "pawn");
    this.setCell("G7", "black", "pawn");
    this.setCell("H7", "black", "pawn");
    this.setCell("A2", "white", "pawn");
    this.setCell("B2", "white", "pawn");
    this.setCell("C2", "white", "pawn");
    this.setCell("D2", "white", "pawn");
    this.setCell("E2", "white", "pawn");
    this.setCell("F2", "white", "pawn");
    this.setCell("G2", "white", "pawn");
    this.setCell("H2", "white", "pawn");
    this.setCell("A1", "white", "castle");
    this.setCell("B1", "white", "knight");
    this.setCell("C1", "white", "bishop");
    this.setCell("D1", "white", "queen");
    this.setCell("E1", "white", "king");
    this.setCell("F1", "white", "bishop");
    this.setCell("G1", "white", "knight");
    this.setCell("H1", "white", "castle");
  } else {
    // TODO: parse
    throw("I cannot parse boardState yet!");
  }
}; // function ChessJS.prototype.setBoard()

/* GETTERS */

ChessJS.prototype.getCell = function (cell) {
  return (this.board[cell] || null);
}; // function ChessJS.prototype.getCell()

/* EVENT LISTENERS */

ChessJS.prototype.mousemove = function (e) {
  let x    = e.offsetX;
  let y    = e.offsetY;
  let col  = this.convert.XToCol(x);
  let row  = this.convert.YToRow(y);
  let cell = this.convert.XYToCell(x, y);
  if (col != null && row != null) {
    if (this.mouse.hover.cell != null) {
      let oldCell = this.mouse.hover.cell;
      this.mouse.hover = { x: x, y: y, cell: cell };
      // only write to the screen if there's a change
      if (oldCell != cell) {
        this.drawCell(cell);
        this.drawCell(oldCell);
      }
    } else {
      this.mouse.hover = { x: x, y: y, cell: cell };
      this.drawCell(cell);
    }
  } else {
    let oldCell = this.mouse.hover.cell;
    this.mouse.hover = { x: null, y: null, cell: null };
    if (oldCell != null) {
      this.drawCell(oldCell);
    }
  }
}; // function ChessJS.prototype.mousemove()

ChessJS.prototype.mousedown = function (e) {
  let x    = e.offsetX;
  let y    = e.offsetY;
  let cell = this.convert.XYToCell(x, y);
  this.mouse.down = { hold: true, x: x, y: y, cell: cell };
  this.drawBoard();
}; // function ChessJS.prototype.mousedown()

ChessJS.prototype.mouseup = function (e) {
  this.mouse.down = { hold: false, x: null, y: null, cell: null };
  this.drawBoard();
}; // function ChessJS.prototype.mouseup()


/* HELPERS */

/**
 * CONVERTERS
 * - Cell: a string, e.g. 'A1', 'B2', etc. Use getCell() for the struct
 * - Col/Row: a string, e.g. 'A', 'B', etc.; '1', '2', etc.
 * - Idx/Idy: a number representing the row or col, e.g. 1, 2, etc.
 * - X/Y: a number, x or y in pixels
 *
 * ChessJS() will run this.convert() to rebind convert() to ChessJS().
 * Otherwise, the conversion functions would bind `this` to convert()
 * instead of to ChessJS().
 */

ChessJS.prototype.convert = function() {
  this.convert.CellToColRow = this.convert.CellToColRow.bind(this);
  this.convert.CellToIdxIdy = this.convert.CellToIdxIdy.bind(this);
  this.convert.CellToXY     = this.convert.CellToXY.bind(this);
  this.convert.ColRowToCell = this.convert.ColRowToCell.bind(this);
  this.convert.XToCol       = this.convert.XToCol.bind(this);
  this.convert.XYToCell     = this.convert.XYToCell.bind(this);
  this.convert.XYToColRow   = this.convert.XYToColRow.bind(this);
  this.convert.YToRow       = this.convert.YToRow.bind(this);
}; // ChessJS.prototype.convert()

/* convert from cell */

ChessJS.prototype.convert.CellToColRow = function (cell) {
  let cr  = Array.from(cell);
  return { col: cr[0], row: cr[1] };
}; // ChessJS.prototype.convert.CellToColRow()

ChessJS.prototype.convert.CellToIdxIdy = function (cell) {
  let cr  = Array.from(cell);
  let idx = this.cols.indexOf(cr[0]);
  let idy = this.rows.indexOf(cr[1]);
  return { idx: idx, idy: idy };
}; // ChessJS.prototype.convert.CellToIdxIdy()

ChessJS.prototype.convert.CellToXY = function (cell) {
  let id = this.convert.CellToIdxIdy(cell);
  let x  = id.idx * this.segmentSize;
  let y  = id.idy * this.segmentSize;
  return { x: x, y: y };
}; // ChessJS.prototype.convert.CellToXY()

/* convert from col/row */

ChessJS.prototype.convert.ColRowToCell = function (col, row) {
  return col+row; // e.g. 'A' + '1' = 'A1'
}; // ChessJS.prototype.convert.ColRowToCell()

/* convert from x */

ChessJS.prototype.convert.XToCol = function (x) {
  return this.cols[Math.floor(x / this.segmentSize)];
}; // ChessJS.prototype.convert.XToCol()

/* convert from x/y */

ChessJS.prototype.convert.XYToCell = function (x, y) {
  let col = this.convert.XToCol(x);
  let row = this.convert.YToRow(y);
  return this.convert.ColRowToCell(col, row);
}; // ChessJS.prototype.convert.XYToCell()

ChessJS.prototype.convert.XYToColRow = function (x, y) {
  let col = this.convert.XToCol(x);
  let row = this.convert.YToRow(y);
  return { col: col, row: row };
}; // ChessJS.prototype.convert.XYToColRow()

/* convert from y */

ChessJS.prototype.convert.YToRow = function (y) {
  return this.rows[Math.floor(y / this.segmentSize)];
}; // ChessJS.prototype.convert.YToRow()
