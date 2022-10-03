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
            self.object.style.left = `${e.clientX+XOffset}px`;
            self.object.style.top = `${e.clientY+YOffset}px`;
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

        this.object = undefined;
    }
}

let Nodes = [];
class Node extends Draggable {
    constructor(x,y) {
        super(...arguments);
        this.x = x;
        this.y = y;

        this.gui = [];
        this.gui[0] = document.createElement("div");

        this.gui[0].className = "node";
        this.enabledragging(this.gui[0]);
        
        document.body.appendChild(this.gui[0]);

        Nodes.push(this);
    }

    destroy() {
        this.disabledragging();
    }
}

class Interactive extends Node {
    constructor(x,y) {
        super(...arguments);
    }
}

const test = new Interactive(0,10);