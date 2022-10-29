const canvas = document.getElementById("myCanvas");
const ctx  = canvas.getContext("2d");

var CanvasOffsetX = 0
var CanvasOffsetX = 0
var camX = 0
var camY = 0
var gridSize = 512

class Draggable {
    constructor() {
        this.object;
    }

    _mousedown(e) {
        const Bounding = this.object.getBoundingClientRect();
        const XOffset = Bounding.left + Bounding.width/2 - e.clientX;
        const YOffset = Bounding.top + Bounding.height/2 - e.clientY;
        const self = this

        function MM(e) {
            self.x = Math.round((e.clientX+XOffset-camX)/gridSize)
            self.y = Math.round((e.clientY+YOffset-camY)/gridSize)
            self.updateposition();
        }

        function MU(e) {
            window.removeEventListener("mousemove",MM);
            window.removeEventListener("mouseup",MU);
        }

        window.addEventListener("mousemove",MM);
        window.addEventListener("mouseup",MU);

    }

    enabledragging(gui) {
        if (this.object) { return; }
        this.object = gui;

        this.object.addEventListener("mousedown",(e) => this._mousedown(e));
    }

    disabledragging() {
        if (!this.object) { return; }

        this.object.removeEventListener("mousedown",(e) => this._mousedown(e));

        this.object = null;
    }
}

class Node extends Draggable {
    constructor(layer,x,y,data) {
        super(...arguments);
        if (layer.constructor.name == "Layer") {
            this.layer = layer;
            this.x = x ?? 0;
            this.y = y ?? 0;
            this.data = data ?? {};
            this.layer.nodes.push(this);
        } else {
            console.log("you must pass a layer.");
            delete this;
        }
    }

    render() {
        var img = new Image;
        img.onload = function() {
            let X = CanvasOffsetX + this.y * gridSize - gridSize/2 - camX
            let Y = CanvasOffsetY + this.x * gridSize - gridSize/2 - camY
            ctx.drawImage(img,X,Y,gridSize,gridSize)
        }
        img.src = `Images/${this.data.shapeId}/${this.data.mode ?? 0}/${this.data.active ?? false}.png`
    }
}

var VLayers = [];
class Layer {
    constructor(name) {
        this.name = name;
        this.nodes = [];
    }

    show() {
        if (VLayers.includes(this)) { return; }
        VLayers.push(this);
    }
    
    hide() {
        VLayers.splice(VLayers.indexOf(this),1)
    }

    render() {
        for (let node of this.nodes) {
            node.render();
        }
    }
}

// Camera

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    var startpoint = Math.round(canvas.width/gridSize)*gridSize - gridSize/2 + camX % gridSize
    for (let i=-startpoint; i<canvas.width/2; i=i+gridSize) {
        ctx.beginPath();
        ctx.moveTo(CanvasOffsetX+i, 0);
        ctx.lineTo(CanvasOffsetX+i, canvas.height);
        ctx.stroke();
    }

    var startpoint = Math.round(canvas.height/gridSize)*gridSize - gridSize/2 + camY % gridSize
    for (let i=-startpoint; i<canvas.height/2; i=i+gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, CanvasOffsetY+i);
        ctx.lineTo(canvas.width, CanvasOffsetY+i);
        ctx.stroke();
    }

    for (let layer of VLayers) {
        layer.render();
    }
}

function CanvasResize() {
    canvas.width = window.innerWidth - 4
    canvas.height = window.innerHeight - 4
    canvas.style = "position:absolute;left:0%;top:0%;border:2px solid blue;";
    CanvasOffsetX = canvas.width/2
    CanvasOffsetY = canvas.height/2
    render();
}
addEventListener('resize', CanvasResize);

// Handle Inputs

function mousedown(e) {
    const MX = e.clientX;
    const MY = e.clientY;
    const CX = camX;
    const CY = camY;

    function mousemove(e) {
        camX = CX + MX - e.clientX;
        camY = CY + MY - e.clientY;
        render();
    }

    function mouseup(e) {
        canvas.removeEventListener("mousemove",mousemove);
        canvas.removeEventListener("mouseup",mouseup);
    }
    
    canvas.addEventListener("mousemove",mousemove);
    canvas.addEventListener("mouseup",mouseup);
}

canvas.addEventListener("mousedown",mousedown);

// Init

const Layer1 = new Layer("test")
const Node1 = new Node(Layer1,0,0,{"shapeId":"9f0f56e8-2c31-4d83-996c-d00a9b296c3f","mode":2,"active":false});

Layer1.show();

CanvasResize();