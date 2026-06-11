const TILE_SIZE = 16;
const GRAVITY = 0.1;

function flipAndDrawImage(
    ctx,
    image,
    sx, sy, sw, sh,
    x, y, w, h,
    flipH = false,
    flipV = false
) {
    ctx.save();

    ctx.translate(
        flipH ? x + w : x,
        flipV ? y + h : y
    );

    ctx.scale(
        flipH ? -1 : 1,
        flipV ? -1 : 1
    );

    ctx.drawImage(
        image,
        sx, sy, sw, sh,
        0, 0, w, h
    );

    ctx.restore();
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
            this.keysDown.add(e.key);
            for (const o of this.objects){ o.keyDown(e.key); }
        });
        addEventListener('keyup', (e) => {
            if (e.repeat) return;
            this.keysDown.delete(e.key);
            for (const o of this.objects){ o.keyUp(e.key); }
        });

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
            new Tile(4, 13),
            new Tile(6, 14),
            new Tile(6, 10),
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

    keyDown(key){}
    keyUp(key){}

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
        this.frame = 0;
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

    nextFrame(){
        this.frame = (this.frame + 1) % this.animation.length;
    }

    draw(ctx, x, y, flipH, flipV){
        const frameData = this.animation[this.frame];
        
        flipAndDrawImage(
            ctx, this.image, 
            frameData['x'],
            frameData['y'],
            x, y, 
            frameData['w'],
            frameData['h'],
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

        this.hitbox = new CollisionRect(this, 10, 16);
        this.hitbox.offset.x = 3;

        this.sprite = new Sprite('images/client/mario.png');
        this.sprite.addAnimation('idle', 
            [
                {x: 0, y: 0, w: 16, h: 32}
            ]
        );
        this.sprite.setAnimation('idle');
    }

    keyDown(key){
        if (this.hitbox.isGrounded()){
            if (key == 'w') 
                this.vel.y = -3;
        }
    }

    update(dt) {
        this.vel.y += GRAVITY;
        this.pos.y += this.vel.y;
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

        this.vel.x = 0;
        if (Game.instance.keysDown.has('d'))
            this.vel.x = 1;
        if (Game.instance.keysDown.has('a'))
            this.vel.x = -1;

        this.pos.x += this.vel.x;
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
    draw(ctx) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.hitbox.draw(ctx);
        this.sprite.draw(ctx, this.pos.x, this.pos.y, false, false);
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