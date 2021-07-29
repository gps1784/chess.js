/**
 * ChessJS - used to create a new <canvas> *inside* of existing <div>.
 * If you want to use an existing <canvas> object, use ChessJS.useCanvas().
 * TODO:
 * - Add the option(?) for a double-buffer with two stacked canvases
 */

/* create a new canvas and board */
function ChessJS(canvas, boardState=null, w=null, h=null) {
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
  this.board  = {};
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
}; // ChessJS.appendToParent()

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

/* render functions */

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
        this.drawCell(this.convertColRowToCell(col, row));
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
  let xy    = this.convertCellToXY(cell);
  let cr    = this.convertCellToColRow(cell);
  let pc    = this.getCell(cell);
  let down  = this.mouse.down;
  let hover = this.mouse.hover;
  let x     = xy[0];
  let y     = xy[1];
  let col   = cr[0];
  let row   = cr[1];
  let state = 'normal'; // default, e.g. 'hover', 'down'
  /* determine color for background */
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
  console.debug(cell, xy[0], xy[1], pc);
  /* this creates an two-tone XOR pattern across the rows and columns */
  if ((col + row) % 2 === 0) {
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
      context.drawImage(img, col * ss, row * ss, ss, ss);
    } // img.onload
  }
  return this;
}; // function ChessJS.prototype.drawCell()

/* setters */

ChessJS.prototype.clearCell = function (cell) {};

ChessJS.prototype.setCell = function (cell, color, piece) {
  this.board[cell] = { color: color, piece: piece };
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

/* getters */

ChessJS.prototype.getCell = function (cell) {
  return (this.board[cell] || null);
}; // function ChessJS.prototype.getCell()

/* events */
ChessJS.prototype.mousemove = function (e) {
  let x    = e.offsetX;
  let y    = e.offsetY;
  let col  = this.convertToCol(x);
  let row  = this.convertToRow(y);
  let cell = this.convertXYToCell(x, y);
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
  let cell = this.convertXYToCell(x, y);
  this.mouse.down = { hold: true, x: x, y: y, cell: cell };
  this.drawBoard();
}; // function ChessJS.prototype.mousedown()

ChessJS.prototype.mouseup = function (e) {
  this.mouse.down = { hold: false, x: null, y: null, cell: null };
  this.drawBoard();
}; // function ChessJS.prototype.mouseup()
/* helpers */

ChessJS.prototype.convertColRowToCell = function (col, row) {
  if (Number.isInteger(col)) { // if it's an index, not a col, e.g. 'A'
    col = this.convertToCol(col * this.segmentSize);
  }
  if (Number.isInteger(row)) { // if it's an index, not a row, e.g. '1'
    row = this.convertToRow(y * this.segmentSize);
  }
  return col+row;
};

ChessJS.prototype.convertXYToCell = function (x, y) {
  let col = this.convertToCol(x);
  let row = this.convertToRow(y);
  return this.convertColRowToCell(col, row);
};

ChessJS.prototype.convertCellToXY = function (cell) {
  let cr = this.convertCellToColRow(cell);
  let x  = cr[0] * this.segmentSize;
  let y  = cr[1] * this.segmentSize;
  return [x, y];
}; // ChessJS.prototype.convertCellToXY()

ChessJS.prototype.convertCellToColRow = function (cell) {
  let cr  = Array.from(cell);
  let col = this.cols.indexOf(cr[0]);
  let row = this.rows.indexOf(cr[1]);
  return [col, row];
}; // ChessJS.prototype.convertCellToColRow()

ChessJS.prototype.convertToCol = function (x) {
  return this.cols[Math.floor(x / this.segmentSize)];
};

ChessJS.prototype.convertToRow = function (y) {
  return this.rows[Math.floor(y / this.segmentSize)];
};
