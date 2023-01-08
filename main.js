const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");

var CanvasOffsetX = 0;
var CanvasOffsetX = 0;
var camX = 0;
var camY = 0;
var gridSize = 128;

var mouseX = 0;
var mouseY = 0;

var Textures = {};

// Utils //
var LineColor = window.matchMedia('(prefers-color-scheme: dark)').matches && '#404040' || '#000000'

// Classes //

class Node {
  constructor(layer, x, y, data) {
    if (!layer || layer.constructor.name == "Layer") {
      this.layer = layer;
      this.x = x ?? 0;
      this.y = y ?? 0;
      this.data = data ?? {};
      if (layer) { this.layer.nodes.push(this); }
      this.inputs = [];
      this.outputs = [];
    } else {
      console.log("you must pass a layer.");
      delete this;
    }
  }

  delete() {
    const index = this.layer.nodes.findIndex((element) => element == this);
    this.layer.nodes.splice(index, 1);
    delete this;
    render();
  }

  connected(node) {
    const input = this.inputs.findIndex((element) => element == node);
    const output = this.outputs.findIndex((element) => element == node);
    if (input != -1 || output != -1) {
      return true;
    }
  }

  removeinput(node) {
    const index = this.inputs.findIndex((element) => element == node);
    AddUpdateLogic(this);
    this.inputs.splice(index, 1);
  }

  removeoutput() {
    const index = this.outputs.findIndex((element) => element == node);
    this.outputs.splice(index, 1);
  }

  appendinput(node) {
    if (this.inputs.find((element) => element == node)) {
      return;
    }
    this.inputs.push(node);
    AddUpdateLogic(this);
  }

  appendoutput(node) {
    if (this.outputs.find((element) => element == node)) {
      return;
    }
    if (this.inputs.find((element) => element == node)) {
      return;
    }
    this.outputs.push(node);
    AddUpdateLogic(this);
  }

  activeupdate(NewState) {
    if (NewState == this.data.active) {
      return;
    }
    this.data.active = NewState;

    for (let output of this.outputs) {
      AddUpdateLogic(output);
    }
  }

  render() {
    if (
      !Textures[this.data.shapeId] ||
      !Textures[this.data.shapeId][this.data.mode ?? 0] ||
      !Textures[this.data.shapeId][this.data.mode ?? 0][
        this.data.active ?? false
      ]
    ) {
      if (!Textures[this.data.shapeId]) {
        Textures[this.data.shapeId] = {};
      }
      if (!Textures[this.data.shapeId][this.data.mode ?? 0]) {
        Textures[this.data.shapeId][this.data.mode ?? 0] = {};
      }
      let Target = Textures[this.data.shapeId][this.data.mode ?? 0];
      Target[this.data.active ?? false] = new Image();
      Target = Target[this.data.active ?? false];

      Target.onload = render;
      Target.src = `Images/${this.data.shapeId}/${this.data.mode ?? 0}/${
        this.data.active ?? false
      }.png`;
    }
    let X = CanvasOffsetX - this.x * gridSize - gridSize / 2 - camX;
    let Y = CanvasOffsetY - this.y * gridSize - gridSize / 2 - camY;
    ctx.drawImage(
      Textures[this.data.shapeId][this.data.mode ?? 0][
        this.data.active ?? false
      ],
      X,
      Y,
      gridSize,
      gridSize
    );
  }

  renderlines() {
    for (let output of this.outputs) {
      const [X, Y] = ToWorldSpace(this.x * gridSize, this.y * gridSize);
      const [XX, YY] = ToWorldSpace(output.x * gridSize, output.y * gridSize);
      DrawLine(X, Y, XX, YY);
    }
  }
}

function NodesInCell(GridX, GridY) {
  let Node;
  for (layer of VLayers) {
    for (node of layer.nodes) {
      if (node.x == GridX && node.y == GridY) {
        Node = node;
        break;
      }
    }
    if (Node) {
      break;
    }
  }
  return Node;
}

var VLayers = [];
class Layer {
  constructor(name) {
    this.name = name;
    this.nodes = [];
  }

  show() {
    if (VLayers.includes(this)) {
      return;
    }
    VLayers.push(this);
  }

  hide() {
    VLayers.splice(VLayers.indexOf(this), 1);
  }

  render() {
    for (let node of this.nodes) {
      node.render();
    }
    for (let node of this.nodes) {
      node.renderlines();
    }
  }
}

class LogicGate extends Node {
  constructor(layer, x, y, data) {
    super(...arguments);
  }

  cyclemode(val) {
    if (val) {
      this.data.mode = this.data.mode >= 5 ? 0 : this.data.mode + 1;
    } else {
      this.data.mode = this.data.mode < 0 ? 5 : this.data.mode - 1;
    }
    AddUpdateLogic(this);
    render();
  }

  update() {
    let NewState = false;
    if (this.data.mode == 0) {
      NewState = (this.inputs.length > 0) && true || false;
      for (let node of this.inputs) {
        if (!node.data.active) {
          NewState = false;
          break;
        }
      }
    } else if (this.data.mode == 1) {
      for (let node of this.inputs) {
        if (node.data.active) {
          NewState = true;
          break;
        }
      }
    } else if (this.data.mode == 2) {
      for (let node of this.inputs) {
        if (node.data.active) {
          NewState = !NewState;
        }
      }
    } else if (this.data.mode == 3) {
      for (let node of this.inputs) {
        if (!node.data.active) {
          NewState = true;
          break;
        }
      }
    } else if (this.data.mode == 4) {
      NewState = (this.inputs.length > 0) && true || false;
      for (let node of this.inputs) {
        if (node.data.active) {
          NewState = false;
          break;
        }
      }
    } else if (this.data.mode == 5) {
      NewState = (this.inputs.length > 0) && true || false;
      for (let node of this.inputs) {
        if (node.data.active) {
          NewState = !NewState;
        }
      }
    }

    this.activeupdate(NewState);
  }
}

class Button extends Node {
  constructor(layer, x, y, data) {
    super(...arguments);
  }

  interactdown() {
    let dis = this;
    this.activeupdate(true);
    render();
    function func(e) {
      if (e.key == "e") {
        window.removeEventListener("keyup", func);
        dis.activeupdate(false);
        render();
      }
    }
    window.addEventListener("keyup", func);
  }
}

class Switch extends Node {
  constructor(layer, x, y, data) {
    super(...arguments);
  }

  interactdown() {
    this.activeupdate(!this.data.active);
    render();
  }
}

class LayerFunction extends Node {
  constructor(layer, x, y, data) {
    super(...arguments);
    this.targetlayer = Layer1;
    this.clonednodes = [];

    if (this.targetlayer == FocusLayer) {
      this.delete(); 
      return; 
    }

    for (let node of this.targetlayer.nodes) {
      let clonenode = new node.constructor(Layer2, node.x, node.y, node.data)

      for (let input of node.inputs) {
        clonenode.inputs.push(node.layer.nodes.findIndex((element) => element == input));
      }

      for (let output of node.outputs) {
        clonenode.outputs.push(node.layer.nodes.findIndex((element) => element == output));
      }

      this.clonednodes.push(clonenode);
    }

    for (let node of this.clonednodes) {
      for (let input in node.inputs) {
        node.inputs[input] = this.clonednodes[node.inputs[input]];
      }

      for (let output in node.outputs) {
        node.outputs[output] = this.clonednodes[node.outputs[output]];
      }
    }

  }

  cyclemode(val) {
    if (val > 0) {
      this.data.mode = this.data.mode >= 255 ? 0 : this.data.mode+1;
    } else {
      this.data.mode = this.data.mode <= 0 ? 255 : this.data.mode-1;
    }
    AddUpdateLogic(this);
    render();
  }

  render() {
    const [X, Y] = ToWorldSpace(this.x * gridSize, this.y * gridSize)
    const Text = this.targetlayer.name
    const FontSize = gridSize/(Text.length+1)*2
    ctx.font = `${FontSize}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = 'middle';
    ctx.fillStyle = "#FFFFFF"
    ctx.strokeStyle = 'black';
    ctx.lineWidth = FontSize*0.02;
    ctx.fillText(Text, X, Y);
    ctx.strokeText(Text, X, Y);
  }
}

class LayerNode extends Node {
  constructor(layer, x, y, data) {
    super(...arguments);
  }

  cyclemode(val) {
    if (val > 0) {
      this.data.mode = this.data.mode >= 255 ? 0 : this.data.mode+1;
    } else {
      this.data.mode = this.data.mode <= 0 ? 255 : this.data.mode-1;
    }
    AddUpdateLogic(this);
    render();
  }

  render() {
    const [X, Y] = ToWorldSpace(this.x * gridSize, this.y * gridSize)
    ctx.font = `${gridSize}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = 'middle';
    ctx.fillStyle = "#FFFFFF"
    ctx.strokeStyle = 'black';
    ctx.lineWidth = gridSize*0.02;
    ctx.fillText(this.data.mode, X, Y);
    ctx.strokeText(this.data.mode, X, Y);
  }
}

// Logic //

var PendingLogic = []; // Logic gates awaiting the tick update.

function AddUpdateLogic(object) {
  if (PendingLogic.find((e) => e == object)) {
    return;
  }
  PendingLogic.push(object);
}

function LogicUpdate() {
  let dupe = PendingLogic.slice();
  PendingLogic = [];
  for (let gate of dupe) {
    if (gate.update) {
      gate.update();
    }
  }
  if (dupe.length > 0) {
    render();
  }
}
setInterval(LogicUpdate, 25);

// Rendering

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.lineWidth = 1;
  ctx.lineCap = "butt";
  ctx.strokeStyle = '#000000'
  var startpoint =
    Math.round(canvas.width / gridSize) * gridSize -
    gridSize / 2 +
    (camX % gridSize);
  for (let i = -startpoint; i < canvas.width / 2; i = i + gridSize) {
    ctx.beginPath();
    ctx.moveTo(CanvasOffsetX + i, 0);
    ctx.lineTo(CanvasOffsetX + i, canvas.height);
    ctx.strokeStyle = LineColor
    ctx.stroke();
  }

  var startpoint =
    Math.round(canvas.height / gridSize) * gridSize -
    gridSize / 2 +
    (camY % gridSize);
  for (let i = -startpoint; i < canvas.height / 2; i = i + gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, CanvasOffsetY + i);
    ctx.lineTo(canvas.width, CanvasOffsetY + i);
    ctx.strokeStyle = LineColor
    ctx.stroke();
  }

  for (let layer of VLayers) {
    layer.render();
  }
}

function DrawLine(X, Y, XX, YY) {
  ctx.beginPath();
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.moveTo(X, Y);
  ctx.lineTo(XX, YY);
  ctx.strokeStyle = '#0000FF'
  ctx.stroke();
}

function CanvasResize() {
  canvas.width = window.innerWidth - 4;
  canvas.height = window.innerHeight - 4;
  canvas.style = "position:absolute;left:0%;top:0%;border:2px solid blue;";
  CanvasOffsetX = canvas.width / 2;
  CanvasOffsetY = canvas.height / 2;
  render();
}
addEventListener("resize", CanvasResize);

function ToWorldSpace(x, y) {
  return [CanvasOffsetX - x - camX, CanvasOffsetY - y - camY];
}

function ToGridSpace(x, y) {
  const [X, Y] = ToWorldSpace(x, y);
  return [Math.round(X / gridSize), Math.round(Y / gridSize)];
}

// Handle Inputs

function WireDown(e) {
  const MX = e.clientX;
  const MY = e.clientY;
  const [GX, GY] = ToGridSpace(MX, MY);
  const Node = NodesInCell(GX, GY);
  let Node2;

  function WireUpdate(e) {
    if (!Node) {
      return;
    }
    const [MouseX, MouseY] = [e.clientX, e.clientY];
    const [CGX, CGY] = ToGridSpace(MouseX, MouseY);
    render();
    let Target = NodesInCell(CGX, CGY);
    let Test = (Target && ToWorldSpace(Target.x * gridSize)) || "no";
    let [X, Y] = ToWorldSpace(Node.x * gridSize, Node.y * gridSize);
    let [XX, YY] = (Target &&
      ToWorldSpace(Target.x * gridSize, Target.y * gridSize)) || [
      MouseX,
      MouseY,
    ];
    DrawLine(X, Y, XX, YY);
    Node2 = Target;
  }

  function WireUp(e) {
    if (Node2) {
      if (Node.connected(Node2)) {
        Node.removeoutput(Node2);
        Node2.removeinput(Node);
      } else {
        Node.appendoutput(Node2);
        Node2.appendinput(Node);
      }
    }

    render();
  }

  return { move: WireUpdate, up: WireUp };
}

function DragDown(e) {
  const MX = e.clientX;
  const MY = e.clientY;
  const CX = camX;
  const CY = camY;
  const [GX, GY] = ToGridSpace(MX, MY);
  const Node = NodesInCell(GX, GY);

  function DragUpdate(e) {
    const [MouseX, MouseY] = [e.clientX, e.clientY];
    if (Node) {
      const [CGX, CGY] = ToGridSpace(MouseX, MouseY);
      const NX = node.x;
      const NY = node.y;
      Node.x = CGX;
      Node.y = CGY;
      if (Node.x == NX && Node.y == NY) {
        return;
      } // nothing should have changed visually, no need to update.
    } else {
      // Camera Moving
      camX = CX + MX - MouseX;
      camY = CY + MY - MouseY;
    }
    render();
  }

  function DragUp(e) {}

  return { move: DragUpdate, up: DragUp };
}

const Modes = {
  0: WireDown,
  2: DragDown,
};

function mousedown(e) {
  const Mode = e.button;
  if (!Modes[Mode]) {
    return;
  }
  const Funcs = Modes[Mode](e);

  function mousemove(e) {
    if (Funcs.move) {
      Funcs.move(e);
    }
  }

  function mouseup(e) {
    canvas.removeEventListener("mousemove", mousemove);
    canvas.removeEventListener("mouseup", mouseup);
    if (Funcs.up) {
      Funcs.up(e);
    }
  }

  canvas.addEventListener("mousemove", mousemove);
  canvas.addEventListener("mouseup", mouseup);
}

function mousemove(e) {
  mouseX = e.clientX;
  mouseY = e.clientY;
}
canvas.addEventListener("mousemove", mousemove);

function keydown(e) {
  if (e.key == "e") {
    const MX = mouseX;
    const MY = mouseY;
    const [GX, GY] = ToGridSpace(MX, MY);
    const Node = NodesInCell(GX, GY);
    if (Node && Node.interactdown) {
      Node.interactdown();
    }
  } else if (e.key.toLowerCase() == "f") {
    const MX = mouseX;
    const MY = mouseY;
    const [GX, GY] = ToGridSpace(MX, MY);
    const Node = NodesInCell(GX, GY);
    if (Node && Node.cyclemode) {
      Node.cyclemode(e.key == "f" ? true : false);
    }
  }
}

function keyup(e) {
  if (e.key == "e") {
    const MX = mouseX;
    const MY = mouseY;
    const [GX, GY] = ToGridSpace(MX, MY);
    const Node = NodesInCell(GX, GY);
    if (Node && Node.interactup) {
      Node.interactup();
    }
  } else if (e.key == "x") {
    const MX = mouseX;
    const MY = mouseY;
    const [GX, GY] = ToGridSpace(MX, MY);
    const Node = NodesInCell(GX, GY);
    if (Node && Node.delete) {
      Node.delete();
    }
  } else if (e.key == "b") {
    let Blueprint = {bodies:[{childs:[]}],version:4}
    let index = 0
    for (let Node of Layer1.nodes) {
      index++
      Node.index = index
    }
    for (let Node of Layer1.nodes) {
      let ids = []
      for (let Out of Node.outputs) {
        ids.push({id:Out.index})
      }
      const LogicGate = {color:"DF7F01",controller:{"active":false,"controllers":ids,id:Node.index,joints:null,mode:Node.data.mode},pos:{x:Node.index,y:0,z:0},shapeId:Node.data.shapeId,xaxis:1,zaxis:-2}
      if (Node.data.shapeId != "00000000-0000-0000-0000-000000000000") {
        Blueprint.bodies[0].childs.push(LogicGate);
      }
    }
    navigator.clipboard.writeText(JSON.stringify(Blueprint));
    document.getElementsByClassName("info")[0].hidden = false;
    window.setTimeout(() => {
      document.getElementsByClassName("info")[0].hidden = true;
    }, 3000);
  } else if (e.key == "n") {
    if (VLayers.includes(Layer1)) {
      Layer1.hide();
      Layer2.show();
      FocusLayer = Layer2;
    } else {
      Layer1.show();
      Layer2.hide();
      FocusLayer = Layer1;
    }
  }
}

window.addEventListener("keydown", keydown);
window.addEventListener("keyup", keyup);

function zoom(e) {
  gridSize =
    (Math.sign(e.wheelDeltaY) == 0 && gridSize) ||
    (Math.sign(e.wheelDeltaY) > 0 && gridSize * 1.25) ||
    gridSize / 1.25;
  render();
}

canvas.addEventListener("mousedown", mousedown);
canvas.addEventListener("wheel", zoom);

document.addEventListener("contextmenu", (event) => event.preventDefault());

// Init

const Interactables = {
  "9f0f56e8-2c31-4d83-996c-d00a9b296c3f": LogicGate,
  "1e8d93a4-506b-470d-9ada-9c0a321e2db5": Button,
  "7cf717d7-d167-4f2d-a6e7-6b2c70aa3986": Switch,
  "LayerFunction": LayerFunction,
  "LayerNode": LayerNode
}

const Layer1 = new Layer("Main");
const Layer2 = new Layer("Test");

var FocusLayer = Layer1;

window.onload = (event) => {
  for (let btn of document.getElementsByClassName("displaynode")) {
    function activated() {
      let [X, Y] = ToGridSpace(CanvasOffsetX,CanvasOffsetY)
      let Class = Interactables[btn.getAttribute("name")] || Node
      new Class(FocusLayer, X, Y, {
        shapeId: btn.getAttribute("name"),
        mode: 0,
        active: false,
      });
      render();
    }
    btn.addEventListener("mousedown",activated);
  }  
};

Layer1.show();
CanvasResize();
