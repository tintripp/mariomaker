const TILE_SIZE = 16;
const JUMP_GRAVITY = 0.12;
const GRAVITY = 0.36;

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

        this.level = new Level();

        this.keysDown = new Set();
        addEventListener('keydown', (e) => {
            if (e.repeat) return;
            this.keysDown.add(e.code);
            for (const o of this.level.objects){ o.keyDown(e.code); }
        });
        addEventListener('keyup', (e) => {
            if (e.repeat) return;
            this.keysDown.delete(e.code);
            for (const o of this.level.objects){ o.keyUp(e.code); }
        });

    }

    update(dt) {
        this.level.update(dt);
    }

    draw() {
        this.ctx.fillStyle = 'rgb(151, 141, 250)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.level.draw(this.ctx);
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

class Level {
    constructor(){
        this.objects = [
            new Player(2, 4),
            new Player(3, 4),
            new Player(3, 3),

            new GroundBlock(0, 14),
            new GroundBlock(1, 14),
            new GroundBlock(2, 14),
            new GroundBlock(3, 14),
            new GroundBlock(4, 14),
            new GroundBlock(5, 14),
            new GroundBlock(6, 14),
            new GroundBlock(7, 14),
            new GroundBlock(8, 14),
            new GroundBlock(9, 14),
            new GroundBlock(10, 14),
            new GroundBlock(11, 14),
            new GroundBlock(12, 14),
            new GroundBlock(13, 14),
            new GroundBlock(0, 15),
            new GroundBlock(1, 15),
            new GroundBlock(2, 15),
            new GroundBlock(3, 15),
            new GroundBlock(4, 15),
            new GroundBlock(5, 15),
            new GroundBlock(6, 15),
            new GroundBlock(7, 15),
            new GroundBlock(8, 15),
            new GroundBlock(9, 15),
            new GroundBlock(10, 15),
            new GroundBlock(11, 15),
            new GroundBlock(12, 15),
            new GroundBlock(13, 15),


            new GroundBlock(14, 13),
            new GroundBlock(14, 12),
            new GroundBlock(14, 11),
            new GroundBlock(14, 10),
        ];
    }

    update(dt) {
        for (const obj of this.objects){
            obj.update(dt);
        }
    }

    draw(ctx) {
        for (const obj of this.objects){
            obj.draw(ctx);
        }
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

        for (const obj of Game.instance.level.objects){
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
        this.sprite.addAnimation('idle', [{x:0,y:0,w:16,h:16}]);
        this.sprite.addAnimation('skid', [{x:64,y:0,w:16,h:16}]);
        this.sprite.addAnimation('jump', [{x:80,y:0,w:16,h:16}]);
        this.sprite.addAnimation('die', [{x:112,y:0,w:16,h:16}]);
        this.sprite.addAnimation('walk', [
            {x:16,y:0,w:16,h:16},
            {x:32,y:0,w:16,h:16},
            {x:48,y:0,w:16,h:16}
        ]);
        this.sprite.setAnimation('walk');

        this.jumpHeightMin = 4;
        this.jumpHeightMax = 4.5;

        this.acceleration = 0.12;
        this.deceleration = 0.07;
        this.walkSpeed = 1;
        this.runSpeed = 2.6;
    }

    keyDown(code){
        if (this.hitbox.isGrounded()){
            if (code == 'KeyW') {
                if (Math.abs(this.vel.x) >= this.runSpeed - 0.1)
                    this.vel.y = -this.jumpHeightMax;
                else
                    this.vel.y = -this.jumpHeightMin;
                this.sprite.setAnimation('jump');
            }
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
        if (isKeyDown('KeyW') && this.vel.y < 0)
            this.vel.y += JUMP_GRAVITY;
        else
            this.vel.y += GRAVITY;


        //movement
        let moveFactor = 0;

        if (isKeyDown('KeyA')) moveFactor -= 1;
        if (isKeyDown('KeyD')) moveFactor += 1;

        if (this.hitbox.isGrounded()){
            if (moveFactor < 0) this.dir = Direction.LEFT;
            if (moveFactor > 0) this.dir = Direction.RIGHT;
        }

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
        //movement

        this.move(this.vel.x, this.vel.y);

        if (this.sprite.animName == 'jump'){
            if (this.hitbox.isGrounded()){
                this.sprite.setAnimation('idle');
            }
        }
        if (this.sprite.animName != 'jump'){
            this.sprite.setAnimation('idle');
            if (this.vel.x) {
                this.sprite.setAnimation('walk');
                if (moveFactor && Math.sign(this.vel.x) != moveFactor) 
                    this.sprite.setAnimation('skid');
            }

            if (this.sprite.animName == 'walk')
                this.sprite.framePos += Math.abs(this.vel.x) / 8;
        }
    }
    draw(ctx) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        //this.hitbox.draw(ctx);
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

    draw(ctx) {
        ctx.fillStyle = 'black';
        this.hitbox.draw(ctx);
    }
}

class GroundBlock extends Tile{
    constructor(x,y){
        super(x,y);
        this.sprite = new Sprite('images/client/blocks.png');
        this.sprite.addAnimation('idle', [{x:0,y:0,w:16,h:16}]);
        this.sprite.setAnimation('idle');
    }

    update(dt) {}
    draw(ctx) {
        super.draw(ctx);
        this.sprite.draw(ctx, this.pos.x, this.pos.y);
    }
}

const canvas = document.querySelector('#editor');
new Game(canvas).start();