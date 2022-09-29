function containsObject(obj, list) {
  var i;
  for (i = 0; i < list.length; i++) {
      if (list[i] == obj) {
          return true;
      }
  }

  return false;
}

var Nodes = [];
var Lines = [];
class Line {
  constructor(id) {
    this.id = id || -1;
  }

  init(div1, div2) {
    Lines.push(this);

    const Line = document.createElement("div");

    Line.className = "line";

    this.gui = [Line];
    this.div1 = div1;
    this.div2 = div2;

    document.body.appendChild(Line);

    this.update();
  }

  update(xdict, ydict) {
    const val1 = xdict ||
      (this.div1 && this.div1.getBoundingClientRect()) || { left: 0, top: 0 };
    const val2 = ydict ||
      (this.div2 && this.div2.getBoundingClientRect()) || {
        left: 100,
        top: 100,
      };

    let ax = val1.left + 5;
    let ay = val1.top;
    let bx = val2.left + 5;
    let by = val2.top;
    // this below is from stack overflow
    if (ax > bx) {
      bx = ax + bx;
      ax = bx - ax;
      bx = bx - ax;

      by = ay + by;
      ay = by - ay;
      by = by - ay;
    }

    let distance = Math.sqrt(Math.pow(bx - ax, 2) + Math.pow(by - ay, 2));
    let calc = Math.atan((by - ay) / (bx - ax));
    let degree = (calc * 180) / Math.PI;

    // now we apply the fancy stack overflow stuff idk

    this.gui[0].style.width = `${distance}px`;
    this.gui[0].style.height = `${10}px`;
    this.gui[0].style.top = `${ay}px`;
    this.gui[0].style.left = `${ax}px`;
    this.gui[0].style.transformOrigin = "center left";
    this.gui[0].style.transform = `rotate(${degree}deg)`;
  }

  destroy() {
    if (this.connected) {
      const Node1 = FindNode(this.div1.parentNode);
      const Node2 = FindNode(this.div2.parentNode);
      if (Node1) {
        const N1 = Node1.outputs.findIndex((item) => {
          return item == Node2;
        });
        if (N1 != -1) {
          Node1.outputs.splice(N1,1);
        }
        const N2 = Node1.lines.findIndex((item) => {
            return item == this;
          });
          if (N2 != -1) {
            Node1.lines.splice(N2,1);
          }
      }
      if (Node2) {
        const N1 = Node2.inputs.findIndex((item) => {
          return item == Node1;
        });
        if (N1 != -1) {
          Node2.inputs.splice(N1,1);
        }
        const N2 = Node2.lines.findIndex((item) => {
            return item == this;
          });
          if (N2 != -1) {
            Node2.lines.splice(N2,1);
          }
      }
    }
    this.gui[0].remove();
    delete this;
  }
}

class Node {
  constructor(id, shapeid, title, desc) {
    this.id = id;
    this.shapeid = shapeid
    this.title = title;
    this.desc = desc;
    this.x = 0;
    this.y = 0;
    this.inputs = [];
    this.outputs = [];
    this.lines = [];
    this.active = false;
    this.laststate = false;
  }

  nodeinteraction(e) {
    e.stopImmediatePropagation();
    let test = new Line();
    test.init(this.gui["Out"], this.gui["Out"]);

    window.addEventListener("mousemove", mousemove);
    window.addEventListener("mouseup", mouseup);
    window.addEventListener("touchmove", mousemove);
    window.addEventListener("touchend", mouseup);

    var seconddir;

    function mousemove(e) {
      var list = document.elementsFromPoint(e.clientX, e.clientY);
      let secondargs = { left: e.clientX, top: e.clientY };
      seconddir = undefined;
      for (const item of list) {
        if (item.className == "in") {
          secondargs = item.getBoundingClientRect();
          seconddir = item;
        }
        if (item.className == "node") {
          const In = item.getElementsByClassName("in")
          if (In && In[0]) {
            secondargs = In[0].getBoundingClientRect();
            seconddir = In[0];
            break;
          }
        }
      }
      console.log(secondargs);
      test.update(undefined, secondargs);
    }

    function mouseup(e) {
      window.removeEventListener("mousemove", mousemove);
      window.removeEventListener("mouseup", mouseup);
      window.removeEventListener("touchmove", mousemove);
      window.removeEventListener("touchend", mouseup);
      if (seconddir) {
        test.div2 = seconddir;
        const Node1 = FindNode(test.div1.parentNode);
        const Node2 = FindNode(test.div2.parentNode);
        if (Node1 && Node2 && Node1 != Node2 && !containsObject(Node1,Node2.outputs)) {
          test.connected = true;
          Node1.outputs.push(Node2);
          Node2.inputs.push(Node1);
          Node1.lines.push(test);
          Node2.lines.push(test);
          Node2.logicupdate();
        } else {
          test.destroy();
        }
      } else {
        test.destroy();
      }
    }
  }

  mousedown(e) {

    if (e.which == 3) {
      this.destroy();
      return;
    }

    this.gui["Title"].classList.add("active");

    const PosX = e.clientX || e.touches[0].clientX;
    const PosY = e.clientY || e.touches[0].clientY;

    window.addEventListener("mousemove", mousemove);
    window.addEventListener("mouseup", mouseup);
    window.addEventListener("touchmove", mousemove);
    window.addEventListener("touchend", mouseup);

    const rect = this.gui["Title"].getBoundingClientRect();
    const offsetX = rect.left + rect.width / 2 - PosX;
    const offsetY = rect.top + rect.height / 2 - PosY;

    var self = this;
    function mousemove(e) {
      const X = (e.clientX || e.touches[0].clientX) + offsetX;
      const Y = (e.clientY || e.touches[0].clientY) + offsetY;

      self.x = (X - camX) / (gridSize / defaultGrid);
      self.y = (Y - camY) / (gridSize / defaultGrid);

      self.update();
    }

    function mouseup(e) {
      self.gui["Title"].classList.remove("active");
      window.removeEventListener("mousemove", mousemove);
      window.removeEventListener("mouseup", mouseup);
      window.removeEventListener("touchmove", mousemove);
      window.removeEventListener("touchend", mouseup);
    }
  }

  init(x, y) {

    Nodes.push(this);

    this.x = x || this.x;
    this.y = y || this.y;

    const Frame = document.createElement("div");
    const Title = document.createElement("header");
    const Content = document.createElement("div");
    const Description = document.createElement("div");
    const In = document.createElement("div");
    const Out = document.createElement("div");

    Frame.className = "node";
    Content.className = "content";
    Description.className = "title";
    In.className = "in";
    Out.className = "out";

    Title.textContent = this.title;
    Description.textContent = this.desc;

    Frame.appendChild(Title);
    Frame.appendChild(Content);
    Frame.appendChild(In);
    Frame.appendChild(Out);
    Content.appendChild(Description);

    document.body.appendChild(Frame);

    this.gui = {Frame:Frame, Title:Title, Content:Content, Description:Description, In:In, Out:Out};
    
    let number;
    let jank;
    if (this.title == "SWITCH") {
        number = 1;
    } else {
        number = 0;
    }

    if (number != undefined) {
        jank = new Interactable(this,number);
    }

    this.gui["Frame"].addEventListener("mousedown", (e) => this.mousedown(e));
    this.gui["Frame"].addEventListener("touchstart", (e) => this.mousedown(e));
    Out.addEventListener("mousedown", (e) => this.nodeinteraction(e));
    Out.addEventListener("touchstart", (e) => this.nodeinteraction(e));

    this.update();
  }

  update() {
    this.gui["Frame"].style.left =
      Math.round((this.x * (gridSize / defaultGrid)) / gridSize) * gridSize +
      camX +
      1 +
      "px";
    this.gui["Frame"].style.top =
      Math.round((this.y * (gridSize / defaultGrid)) / gridSize) * gridSize +
      camY +
      1 +
      "px";
    this.gui["Frame"].style.width = `${gridSize * 3}px`;
    this.gui["Frame"].style.height = `${gridSize}px`;

    this.gui["Title"].style.fontSize = `${40 * (gridSize / defaultGrid)}px`;
    /*this.gui["Title"].style.padding = `${10 * (gridSize / defaultGrid)}px ${
      10 * (gridSize / defaultGrid)
    }px`; */

    this.gui["Description"].style.fontSize = `${40 * (gridSize / defaultGrid)}px`;

    for (let item of this.lines) {
        item.update();
    }
  }

  logicupdate() {
    let AND = this.inputs.length > 0 && true || false;
    let ANY = false;
    let EVEN = false;
    let NAND = this.inputs.length > 0 && true || false;
    let NOR = false;
    let XNOR = false;
    for (let item of this.inputs) {
        if (item.active) {
            ANY = true;
            EVEN = !EVEN;
            NAND = false;
        } else {
            AND = false;
            NOR = true;
            XNOR = !XNOR;
        }
    }
    if (this.title == "AND") {
        this.active = AND
    } else if (this.title == "OR") {
        this.active = ANY
    } else if (this.title == "XOR") {
        this.active = EVEN
    } else if (this.title == "NAND") {
        this.active = NAND
    } else if (this.title == "NOR") {
        this.active = NOR
    } else if (this.title == "XNOR") {
        this.active = XNOR
    }
    if (this.laststate == this.active) { return; }
    for (let item of this.outputs) {
      setTimeout(function() {
        item.logicupdate();
      }, 25);
    }

    this.laststate = this.active;

    this.visualupdate();
  }

  visualupdate() {
    this.gui["Frame"].style.backgroundColor = this.active && `green` || `red`;
  }

  destroy() {
    const Clone = this.lines.slice()
    for (let line of Clone) {
      line.destroy();
    }
    const us = Nodes.findIndex((item) => {
      return item == this
    });
    if (us != -1) {
      Nodes.splice(us,1)
    }
    this.gui["Frame"].remove();
    delete this;
  }
}

class Interactable {
    constructor(attach,type) {
        this.attach = attach
        this.type = type
        this.active = false
        this.init();
    }

    init() {
        
        var self = this
        function mousedown(e) {
            if (e.which != 2) { return; }
            e.stopImmediatePropagation();
            if (self.type == 0) {
                self.attach.active = true;
            }
            if (self.type == 1) {
                self.attach.active = !self.attach.active;
            }
            self.attach.logicupdate();
        }

        function mouseup(e) {
            if (e.which != 2) { return; }
            e.stopImmediatePropagation();
            if (self.type == 0) {
                self.attach.active = false;
            }
            self.attach.logicupdate();
        }

        this.attach.gui["Frame"].addEventListener("mousedown",mousedown)
        this.attach.gui["Frame"].addEventListener("touchstart", mousedown);

        this.attach.gui["Frame"].addEventListener("mouseup",mouseup)
        this.attach.gui["Frame"].addEventListener("touchup", mouseup);

    }
}

function FindNode(div) {
  for (const item of Nodes) {
    if (item.gui["Frame"] == div) {
      return item;
    }
  }
}

let camX = 0;
let camY = 0;
let camS = 1;

const defaultGrid = 100;
let gridSize = defaultGrid / 2;

function Update() {
  document.body.style.backgroundPosition = `${camX + gridSize / 2 / camS}px ${
    camY + gridSize / 2 / camS
  }px`;
  document.body.style.backgroundSize = `${gridSize}px ${gridSize}px`;
  for (let i = 0; i < Nodes.length; i++) {
    Nodes[i].update();
  }
  for (let i = 0; i < Lines.length; i++) {
    Lines[i].update();
  }
}

function md(e) {
  const PosX = e.clientX || e.touches[0].clientX;
  const PosY = e.clientY || e.touches[0].clientY;
  const overlapping = document.elementsFromPoint(PosX, PosY);
  if (overlapping.length > 1) {
    return;
  }

  window.addEventListener("mousemove", mm);
  window.addEventListener("mouseup", mu);
  window.addEventListener("touchmove", mm);
  window.addEventListener("touchend", mu);

  let PreviousX = PosX;
  let PreviousY = PosY;

  function mm(e) {
    const X = (e.clientX || e.touches[0].clientX) - PreviousX;
    const Y = (e.clientY || e.touches[0].clientY) - PreviousY;

    camX += X;
    camY += Y;

    PreviousX = e.clientX || e.touches[0].clientX;
    PreviousY = e.clientY || e.touches[0].clientY;
    Update();
  }

  function mu(e) {
    window.removeEventListener("mousemove", mm);
    window.removeEventListener("mouseup", mu);
    window.removeEventListener("touchmove", mm);
    window.removeEventListener("touchend", mu);
  }
}

function zoom(val) {
  gridSize = gridSize - val;
  if (gridSize < 10) {
    gridSize = 10;
  }
}

function scroll(e) {
  if (e.deltaY > 0) {
    zoom(1);
  } else {
    zoom(-1);
  }
  Update();
}

function keyup(e) {
  if (e.key == "f") {
    let Blueprint = {bodies:[{childs:[]}],version:4}
    for (let Node of Nodes) {
      const Index = Nodes.findIndex((val) => {
        return val == Node
      });
      Node.index = Index
    }
    for (let Node of Nodes) {
      let ids = []
      for (let Out of Node.outputs) {
        ids.push({id:Out.index})
      }
      const LogicGate = {color:"DF7F01",controller:{"active":false,"controllers":ids,id:Node.index,joints:null,mode:Node.id},pos:{x:Node.index,y:0,z:0},shapeId:Node.shapeid,xaxis:1,zaxis:-2}
      Blueprint.bodies[0].childs.push(LogicGate);
    }
    console.log(JSON.stringify(Blueprint));
  }
}

window.addEventListener("mousedown", md);
window.addEventListener("wheel", scroll);
window.addEventListener("touchstart", md);
window.addEventListener("keyup", keyup);

var Types = [
  ["AND", "Active if all of the linked triggers are active", "9f0f56e8-2c31-4d83-996c-d00a9b296c3f",0],
  ["OR", "Active if any of the linked triggers are active", "9f0f56e8-2c31-4d83-996c-d00a9b296c3f",1],
  ["XOR", "Active if only one of the linked triggers are active", "9f0f56e8-2c31-4d83-996c-d00a9b296c3f",2],
  ["NAND", "Active if any of the linked triggers are inactive", "9f0f56e8-2c31-4d83-996c-d00a9b296c3f",3],
  ["NOR", "Active if all of the linked triggers are inactive", "9f0f56e8-2c31-4d83-996c-d00a9b296c3f",4],
  ["XNOR", "Active if an even number of linked triggers are inactive", "9f0f56e8-2c31-4d83-996c-d00a9b296c3f",5],
  ["BUTTON", "Held", "1e8d93a4-506b-470d-9ada-9c0a321e2db5",0],
  ["SWITCH", "Toggled", "7cf717d7-d167-4f2d-a6e7-6b2c70aa3986",0],
];

function Test() {
  var test = document.getElementsByClassName("displaynode");
  for (let i = 0; i < test.length; i++) {
    const Type = test[i].outerText.split("\n")[0];

    function Pushed() {
      const Info = Types[i];
      const NodeObject = new Node(i, Types[i][2], Info[0], Info[1]);
      NodeObject.init(
        window.innerWidth - gridSize * 2.5 - camX / (gridSize / defaultGrid),
        window.innerHeight - gridSize * 1.5 - camY / (gridSize / defaultGrid)
      );
    }

    test[i].addEventListener("mouseup", Pushed);
    test[i].addEventListener("touchended", Pushed);
  }
}

window.onscroll = function () {
  window.scrollTo(0, 0);
  return false;
};
window.oncontextmenu = function() {
  return false; // this may annoy some users but its much prefered for my case.
}
Update();

document.body.onload = Test;
