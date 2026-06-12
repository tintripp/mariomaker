const TILE_SIZE = 16;
const GRAVITY = 0.1;

const Direction = {
    LEFT: 1,
    RIGHT: 0,
};

function flipAndDrawImage(ctx, image,
    sx, sy, sw, sh,
    dx, dy, dw, dh,
    flipH = false, flipV = false
) {
    ctx.save();
    ctx.translate(
        flipH ? dx + dw : dx,
        flipV ? dy + dh : dy
    );
    ctx.scale(
        flipH ? -1 : 1,
        flipV ? -1 : 1
    );
    ctx.drawImage(
        image,
        sx, sy, sw, sh,
        0, 0, dw, dh
    );
    ctx.restore();
}

function isKeyDown(code){
    return Game.instance.keysDown.has(code);
}

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

        this.keysDown = new Set();
        addEventListener('keydown', (e) => {
            if (e.repeat) return;
            this.keysDown.add(e.code);
            for (const o of this.objects){ o.keyDown(e.code); }
        });
        addEventListener('keyup', (e) => {
            if (e.repeat) return;
            this.keysDown.delete(e.code);
            for (const o of this.objects){ o.keyUp(e.code); }
        });

        this.objects = [
            new Player(2, 4),

            new Tile(0, 14),
            new Tile(1, 14),
            new Tile(2, 14),
            new Tile(3, 14),
            new Tile(4, 14),
            new Tile(5, 14),
            new Tile(6, 14),
            new Tile(7, 14),
            new Tile(8, 14),
            new Tile(9, 14),
            new Tile(10, 14),
            new Tile(11, 14),
            new Tile(12, 14),
            new Tile(13, 14),
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

    keyDown(code){}
    keyUp(code){}

    update(dt) {}
    draw(ctx) {}
}

class CollisionRect{
    constructor(owner, w, h){
        this.owner = owner;
        this.w = w;
        this.h = h;
        this.offset = {x: 0, y: 0};
        this.terminalVel = 1;
    }

    get x(){
        return this.owner.pos.x + this.offset.x;
    }
    get y(){
        return this.owner.pos.y + this.offset.y;
    }
    set x(v){
        this.owner.pos.x = v - this.offset.x;
    }
    set y(v){
        this.owner.pos.y = v - this.offset.y;
    }

    get collisions(){
        let c = [];

        for (const obj of Game.instance.objects){
            if (obj.hitbox == this) continue;
            if (!obj.hitbox) continue;
            if (this.collidesWith(obj.hitbox))
                c.push(obj);
        }

        return c;
    }

    collidesWith(that){
        return (
            this.x + this.w > that.x && 
            this.x < that.x + that.w && 
            this.y + this.h > that.y && 
            this.y < that.y + that.h
        );
    }

    isGrounded(){
        this.y += 1;
        const grounded = this.collisions.length > 0;
        this.y -= 1;

        return grounded;
    }

    draw(ctx){
        ctx.fillRect(this.x, this.y, this.w, this.h);
    }
}

class Sprite{
    constructor(path){
        this.image = new Image();
        this.image.src = path;

        this.animations = {};
        this.animName = null;

        this.framePos = 0;
    }

    get frame(){
        return Math.floor(this.framePos) % this.animation.length;
    }

    get animation(){
        return this.animations[this.animName];
    }

    addAnimation(name, frames){
        this.animations[name] = frames;
    }

    setAnimation(name){
        this.animName = name;
    }

    draw(ctx, x, y, flipH, flipV){
        const frameData = this.animation[this.frame];
        
        flipAndDrawImage(ctx, this.image,
            frameData.x, frameData.y,
            frameData.w, frameData.h,
            x, y,
            frameData.w, frameData.h,
            flipH, flipV
        );
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
        this.dir = Direction.RIGHT;

        this.hitbox = new CollisionRect(this, 10, 16);
        this.hitbox.offset.x = 3;

        this.sprite = new Sprite('images/client/mario.png');
        this.sprite.addAnimation('idle', [
            {x: 0, y: 0, w: 16, h: 16}
        ]);
        this.sprite.addAnimation('walk', [
            {"x":16,"y":0,"w":16,"h":16},
            {"x":32,"y":0,"w":16,"h":16},
            {"x":48,"y":0,"w":16,"h":16}
        ]);
        this.sprite.setAnimation('walk');

        this.jumpHeightMin = 4.1;
        this.jumpHeightMax = 4.5;
        this.jumpHeight = this.jumpHeightMin;

        this.acceleration = 0.12;
        this.deceleration = 0.07;
        this.walkSpeed = 1;
        this.runSpeed = 2.6;
    }

    keyDown(code){
        if (this.hitbox.isGrounded()){
            if (code == 'KeyW') 
                this.vel.y = -3;
        }
    }

    move(dx, dy){
        this.pos.y += dy;
        for (const collision of this.hitbox.collisions){
            if (this.vel.y > 0){
                // hit floor
                this.hitbox.y = collision.hitbox.y - this.hitbox.h;
                this.vel.y = 0;
            } 
            if (this.vel.y < 0){
                // hit ceiling
                this.hitbox.y = collision.hitbox.y + collision.hitbox.h;
                this.vel.y = 0;
            }
        }

        this.pos.x += dx;
        for (const collision of this.hitbox.collisions){
            if (this.vel.x > 0){
                // r wall
                this.hitbox.x = collision.hitbox.x - this.hitbox.w;
                this.vel.x = 0;
            } 
            if (this.vel.x < 0){
                // l wall
                this.hitbox.x = collision.hitbox.x + collision.hitbox.w;
                this.vel.x = 0;
            }
        }
    }

    update(dt) {
        this.vel.y += GRAVITY;

        //accelerate

        let moveFactor = 0;

        if (isKeyDown('KeyA')) moveFactor -= 1;
        if (isKeyDown('KeyD')) moveFactor += 1;

        if (moveFactor < 0) this.dir = Direction.LEFT;
        if (moveFactor > 0) this.dir = Direction.RIGHT;

        const speed = isKeyDown('ShiftLeft')
            ? this.runSpeed
            : this.walkSpeed;
        const targetSpeed = moveFactor * speed;

        const delta = targetSpeed - this.vel.x;

        const rate =
            Math.abs(targetSpeed) > Math.abs(this.vel.x)
                ? this.acceleration
                : this.deceleration;

        this.vel.x += Math.sign(delta) *
            Math.min(Math.abs(delta), rate);

        this.sprite.framePos += Math.abs(this.vel.x) / 10;
        this.sprite.setAnimation('idle');
        if (this.vel.x) this.sprite.setAnimation('walk');

        this.move(this.vel.x, this.vel.y);
    }
    draw(ctx) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.hitbox.draw(ctx);
        this.sprite.draw(ctx, 
            this.pos.x, this.pos.y, 
            this.dir
        );
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