const TILE_SIZE = 16;
const GRAVITY = 0.1;

class Game {
    static instance;

    constructor(canvas) {
        if (Game.instance) return Game.instance;  
        Game.instance = this;

        this.canvas = canvas;
        this.lastTime = 0;

        this.ctx = canvas.getContext('2d');
        this.ctx.scale(2, 2);
        this.ctx.imageSmoothingEnabled = false;

        this.keysDown = {};
        this.mouseState = {};

        this.objects = [
            new Player(2, 4),

            new Tile(0, 14),
            new Tile(1, 14),
            new Tile(2, 14),
            new Tile(3, 14),
            new Tile(0, 15),
            new Tile(1, 15),
            new Tile(2, 15),
            new Tile(3, 15),
        ];
    }

    update(dt) {
        for (const obj of this.objects){
            obj.update(dt);
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        for (const obj of this.objects){
            obj.draw(this.ctx);
        }
    }

    loop = (timestamp) => {
        const dt = timestamp - this.lastTime;
        this.lastTime = timestamp;

        this.update(dt);
        this.draw();

        requestAnimationFrame(this.loop);
    }

    start() {
        requestAnimationFrame(this.loop);
    }
}

class GameObject {
    constructor(){}

    keyDown(event){}
    keyUp(event){}

    update(dt) {}
    draw(ctx) {}
}

class CollisionRect{
    constructor(owner, w, h){
        this.owner = owner;
        this.w = w;
        this.h = h;
        this.offset = {x: 0, y: 0};
    }

    get x(){
        return this.owner.pos.x + this.offset.x;
    }

    get y(){
        return this.owner.pos.y + this.offset.y;
    }

    collidesWith(that){
        return (
            this.x + this.w > that.x && 
            this.x < that.x + that.w && 
            this.y + this.h > that.y && 
            this.y < that.y + that.h
        );
    }

    draw(ctx){
        ctx.fillRect(this.x, this.y, this.w, this.h);
    }
}

class Player extends GameObject{
    constructor(x,y){
        super();

        this.pos = {
            x: x * TILE_SIZE, 
            y: y * TILE_SIZE - (TILE_SIZE / 2)
        };
        this.vel = {x: 0, y: 0};

        this.hitbox = new CollisionRect(this, 10, 16);
        this.hitbox.offset.x = 3;

        /*
        this.sprite = new Sprite(src);
        this.sprite.addAnimation('idle', 
            [
                {x: 0, y: 0, w: 16, h: 32}
            ]
        );
        this.sprite.setAnimation('idle');
        */
    }

    update(dt) {
        this.vel.y += GRAVITY;
        this.pos.y += this.vel.y;
    }
    draw(ctx) {
        ctx.fillStyle = 'red';
        this.hitbox.draw(ctx);
    }
}

class Tile extends GameObject{
    constructor(x,y){
        super();

        this.pos = {
            x: x * TILE_SIZE, 
            y: y * TILE_SIZE - (TILE_SIZE / 2)
        };

        this.hitbox = new CollisionRect(this, TILE_SIZE, TILE_SIZE);
    }

    update(dt) {}
    draw(ctx) {
        ctx.fillStyle = 'black';
        this.hitbox.draw(ctx);
    }
}

const canvas = document.querySelector('#editor');
new Game(canvas).start();