// Title Scene (Welcome Screen)
class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: "TitleScene" });
  }

  preload() {
    this.load.image("groundStone", "assets/environment/ground_stone1.png");
    // Load sound assets
    this.load.audio('walk', 'assets/sounds/walk.wav');
    this.load.audio('attack', 'assets/sounds/attack.wav');
    this.load.audio('death', 'assets/sounds/death.wav');
    this.load.audio('pickup', 'assets/sounds/pickup.wav');
    
    // UI assets
    this.load.image("highlight", "assets/user interface/highlight/highlight_yellow.png");
    this.load.image("lootIndicator", "assets/user interface/loot-indicator/loot_indicator_yellow.png");
    
    // VFX
    for (let i = 0; i < 8; i++) {
      this.load.image(`glint${i}`, `assets/vfx/glint/glint_${i}.png`);
    }
  }

  create() {
    // Add fullscreen button
    const fullscreenBtn = this.add
      .text(750, 50, "[ ]", { font: "24px Arial", fill: "#ffffff" })
      .setOrigin(1, 0.5)
      .setInteractive();

    fullscreenBtn.on("pointerdown", () => {
      if (this.scale.isFullscreen) {
        this.scale.stopFullscreen();
      } else {
        this.scale.startFullscreen();
      }
    });

    // Background
    const bg = this.add.tileSprite(0, 0, 800, 600, "groundStone").setOrigin(0, 0);
    
    // Title text
    this.add
      .text(400, 100, "Lords of Pain", {
        font: "48px Arial",
        fill: "#ffffff",
      })
      .setOrigin(0.5);

    this.add
      .text(400, 200, "Explore the dungeon and defeat all enemies.", {
        font: "20px Arial",
        fill: "#ffffff",
      })
      .setOrigin(0.5);

    // Device-specific controls text
    const isMobile = this.sys.game.device.os.android || this.sys.game.device.os.iOS;
    const controlText = isMobile ?
      "Left side to move, Right side to attack" :
      "WASD to move, Left Click to attack";

    this.add
      .text(400, 260, controlText, {
        font: "18px Arial",
        fill: "#ffffff",
        align: "center"
      })
      .setOrigin(0.5);

    // Start button
    const start = this.add
      .text(400, 360, "Start Game", {
        font: "32px Arial",
        fill: "#00ff00",
        backgroundColor: "#000000",
        padding: { x: 20, y: 10 }
      })
      .setOrigin(0.5)
      .setInteractive();

    start.on("pointerdown", () => this.scene.start("MainGameScene"));
    start.on("pointerover", () => start.setStyle({ fill: "#ffffff" }));
    start.on("pointerout", () => start.setStyle({ fill: "#00ff00" }));
  }
}

// Game Over Scene
class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameOverScene" });
  }

  create() {
    // Get score and time from main scene
    const data = this.scene.settings.data || {};
    const score = data.score || 0;
    const time = data.time || 0;
    
    const minutes = Math.floor(time / 60000);
    const seconds = Math.floor((time % 60000) / 1000);
    const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    // Game Over text
    this.add
      .text(400, 140, "Game Over", {
        font: "48px Arial",
        fill: "#ff0000",
        stroke: '#000000',
        strokeThickness: 6
      })
      .setOrigin(0.5);
    
    // Display final score and time
    this.add
      .text(400, 210, `Score: ${score}`, {
        font: "28px Arial",
        fill: "#ffffff",
        stroke: '#000000',
        strokeThickness: 3
      })
      .setOrigin(0.5);
      
    this.add
      .text(400, 250, `Time: ${timeString}`, {
        font: "24px Arial",
        fill: "#ffffff",
        stroke: '#000000',
        strokeThickness: 3
      })
      .setOrigin(0.5);

    // Restart button
    const restartBtn = this.add
      .text(400, 320, "Restart", {
        font: "28px Arial",
        fill: "#00ff00",
        backgroundColor: "#000000",
        padding: { x: 20, y: 10 }
      })
      .setOrigin(0.5)
      .setInteractive();

    restartBtn.on("pointerdown", () => {
      this.scene.start("MainGameScene", { restart: true });
    });
    restartBtn.on("pointerover", () => restartBtn.setStyle({ fill: "#ffffff" }));
    restartBtn.on("pointerout", () => restartBtn.setStyle({ fill: "#00ff00" }));

    // Exit button
    const exit = this.add
      .text(400, 390, "Exit to Menu", {
        font: "28px Arial",
        fill: "#00ffff",
        backgroundColor: "#000000",
        padding: { x: 20, y: 10 }
      })
      .setOrigin(0.5)
      .setInteractive();

    exit.on("pointerdown", () => this.scene.start("TitleScene"));
    exit.on("pointerover", () => exit.setStyle({ fill: "#ffffff" }));
    exit.on("pointerout", () => exit.setStyle({ fill: "#00ffff" }));
  }
}

// Main Game Scene
class MainGameScene extends Phaser.Scene {
  constructor() {
    super({ key: "MainGameScene" });
    this.currentWorld = 1;
    this.maxWorlds = 3;
    this.currentRoom = { x: 0, y: 0 };
    this.coins = 0;
    this.playerSpeed = 160;
    this.isMobile = false;
    this.roomActive = false;
    this.clearedRooms = new Set();
    this.visitedRooms = {};
    this.colliders = [];
    this.score = 0;
    this.gameStartTime = 0;
    this.gameTime = 0;
  }

  preload() {
    // Load warrior assets
    const directions = ['E', 'N', 'NE', 'NEE', 'NNE', 'NNW', 'NW', 'NWW', 'S', 'SE', 'SEE', 'SSE', 'SSW', 'SW', 'SWW', 'W'];
    
    // Load warrior idle animations for all directions
    directions.forEach(dir => {
      this.load.image(`warrior_idle_${dir}`, `assets/playable character/warrior/warrior_armed_idle/${dir}/warrior_armed_idle_${dir}_${this.getAngleForDirection(dir)}_0.png`);
    });
    
    // Load warrior walk animations for all directions
    directions.forEach(dir => {
      for (let frame = 0; frame < 8; frame++) {
        this.load.image(
          `warrior_walk_${dir}_${frame}`,
          `assets/playable character/warrior/warrior_armed_walk/${dir}/warrior_armed_walk_${dir}_${this.getAngleForDirection(dir)}_${frame}.png`
        );
      }
    });
    
    // Load skeleton walk animations for all directions
    directions.forEach(dir => {
      for (let frame = 0; frame < 8; frame++) {
        this.load.image(
          `skeleton_walk_${dir}_${frame}`,
          `assets/enemy/skeleton/skeleton_default_walk/${dir}/skeleton_default_walk_${dir}_${this.getAngleForDirection(dir)}_${frame}.png`
        );
      }
    });
    
    // Load skeleton death animations for all directions
    directions.forEach(dir => {
      for (let frame = 0; frame < 8; frame++) {
        this.load.image(
          `skeleton_death_${dir}_${frame}`,
          `assets/enemy/skeleton/skeleton_special_death/${dir}/skeleton_special_death_${dir}_${this.getAngleForDirection(dir)}_${frame}.png`
        );
      }
    });
    
    // Load gold drop for one direction (we'll reuse the same sprite)
    this.load.image('goldDrop', 'assets/prop/gold_drop/E/gold_drop_E_0.0_0.png');
    
    // Environment
    this.load.image('groundStone', 'assets/environment/ground_stone1.png');
    
    // Sound effects
    this.load.audio('walk', 'assets/sounds/walk.wav');
    this.load.audio('attack', 'assets/sounds/attack.wav');
    this.load.audio('death', 'assets/sounds/death.wav');
    this.load.audio('pickup', 'assets/sounds/pickup.wav');
    
    // UI
    this.load.image('highlight', 'assets/user interface/highlight/highlight_yellow.png');
    this.load.image('lootIndicator', 'assets/user interface/loot-indicator/loot_indicator_yellow.png');
    
    // VFX
    for (let i = 0; i < 8; i++) {
      this.load.image(`glint${i}`, `assets/vfx/glint/glint_${i}.png`);
    }
    
    // Heart icons for UI (we'll create these with graphics)
  }
  
  // Helper function to get the angle string for a direction
  getAngleForDirection(dir) {
    const angles = {
      'E': '0.0',
      'NEE': '22.5',
      'NE': '45.0',
      'NNE': '67.5',
      'N': '90.0',
      'NNW': '112.5',
      'NW': '135.0',
      'NWW': '157.5',
      'W': '180.0',
      'SWW': '202.5',
      'SW': '225.0',
      'SSW': '247.5',
      'S': '270.0',
      'SSE': '292.5',
      'SE': '315.0',
      'SEE': '337.5'
    };
    return angles[dir];
  }

  create(data) {
    this.sounds = {
      walk: this.sound.add('walk', { loop: false, volume: 0.3 }), 
      attack: this.sound.add('attack', { loop: false, volume: 0.5 }),
      death: this.sound.add('death', { loop: false, volume: 0.6 }),
      pickup: this.sound.add('pickup', { loop: false, volume: 0.4 })
    };
    
    this.isMobile = this.sys.game.device.os.android || this.sys.game.device.os.iOS;
    this.playArea = { x1: 60, y1: 60, x2: 740, y2: 540 };
    this.physics.world.setBounds(0, 0, this.sys.game.config.width, this.sys.game.config.height);
    
    // Create animations
    this.createAnimations();
    
    // Setup game elements
    this.setupPhysicsGroups();
    this.setupPlayer();
    this.setupInputs();
    this.createUI();
    
    if (data?.restart) { 
      this.resetGame(); 
    }
    
    this.generateRoom();
    
    // Set start time for score tracking
    this.gameStartTime = this.time.now;
    
    // Add some initial enemies
    this.spawnEnemies(3);
  }
  
  createAnimations() {
    const directions = ['E', 'N', 'NE', 'NEE', 'NNE', 'NNW', 'NW', 'NWW', 'S', 'SE', 'SEE', 'SSE', 'SSW', 'SW', 'SWW', 'W'];
    
    // Create warrior walk animations for all directions
    directions.forEach(dir => {
      // Create warrior walk animation for this direction
      this.anims.create({
        key: `warrior_walk_${dir}`,
        frames: [
          { key: `warrior_walk_${dir}_0` },
          { key: `warrior_walk_${dir}_1` },
          { key: `warrior_walk_${dir}_2` },
          { key: `warrior_walk_${dir}_3` },
          { key: `warrior_walk_${dir}_4` },
          { key: `warrior_walk_${dir}_5` },
          { key: `warrior_walk_${dir}_6` },
          { key: `warrior_walk_${dir}_7` }
        ],
        frameRate: 12,
        repeat: -1
      });
    });
    
    // Create skeleton walk animations for all directions
    directions.forEach(dir => {
      this.anims.create({
        key: `skeleton_walk_${dir}`,
        frames: [
          { key: `skeleton_walk_${dir}_0` },
          { key: `skeleton_walk_${dir}_1` },
          { key: `skeleton_walk_${dir}_2` },
          { key: `skeleton_walk_${dir}_3` },
          { key: `skeleton_walk_${dir}_4` },
          { key: `skeleton_walk_${dir}_5` },
          { key: `skeleton_walk_${dir}_6` },
          { key: `skeleton_walk_${dir}_7` }
        ],
        frameRate: 10,
        repeat: -1
      });
      
      // Create skeleton death animations for all directions
      this.anims.create({
        key: `skeleton_death_${dir}`,
        frames: [
          { key: `skeleton_death_${dir}_0` },
          { key: `skeleton_death_${dir}_1` },
          { key: `skeleton_death_${dir}_2` },
          { key: `skeleton_death_${dir}_3` },
          { key: `skeleton_death_${dir}_4` },
          { key: `skeleton_death_${dir}_5` },
          { key: `skeleton_death_${dir}_6` },
          { key: `skeleton_death_${dir}_7` }
        ],
        frameRate: 10,
        repeat: 0
      });
    });
    
    // Create glint effect animation
    this.anims.create({
      key: 'glint',
      frames: [
        { key: 'glint0' },
        { key: 'glint1' },
        { key: 'glint2' },
        { key: 'glint3' },
        { key: 'glint4' },
        { key: 'glint5' },
        { key: 'glint6' },
        { key: 'glint7' }
      ],
      frameRate: 12,
      repeat: 0
    });
  }

  setupPhysicsGroups() { 
    this.walls = this.physics.add.staticGroup(); 
    this.obstacles = this.physics.add.staticGroup();
    this.enemies = this.physics.add.group(); 
    this.pickups = this.physics.add.group(); 
  }
  
  setupPlayer() {
    this.player = this.physics.add.sprite(400, 300, "warrior_idle_S").setDepth(10);
    this.player.setCollideWorldBounds(true); 
    this.player.health = 3; 
    this.player.maxHealth = 3; 
    this.player.lastDamageTime = 0;
    this.player.lastAttackTime = 0;
    this.player.attackCooldown = 500; // ms
    this.player.attackRange = 80;
    this.player.isAttacking = false;
    this.player.facing = 'S'; // Default facing south
    
    // Adjust hitbox size (smaller than visual size for better isometric feel)
    this.player.body.setSize(this.player.width * 0.4, this.player.height * 0.3);
    this.player.body.setOffset(this.player.width * 0.3, this.player.height * 0.6);
    
    // Set sorting offset for isometric depth
    this.player.depth = this.player.y;
  }
  
  setupInputs() { 
    this.keys = this.input.keyboard.addKeys("W,A,S,D,SPACE"); 
    
    if (this.isMobile) { 
      this.setupMobileControls(); 
    } else { 
      // Setup mouse input for attacking
      this.input.on("pointerdown", (ptr) => { 
        this.attackEnemy(ptr);
      });
      
      // Set custom cursor
      this.input.setDefaultCursor(`url(assets/cursorGauntlet.png), pointer`);
    } 
  }
  
  setupMobileControls() {
    // Add virtual joystick for movement
    const leftZone = this.add.zone(200, 300, 400, 600);
    leftZone.setInteractive();
    leftZone.on('pointermove', (pointer) => {
      if (pointer.isDown) {
        // Calculate direction from center of zone
        const dx = pointer.x - 200;
        const dy = pointer.y - 300;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 30) { // Dead zone
          this.movePlayerInDirection(dx / distance, dy / distance);
        }
      }
    });
    
    // Add attack button
    const rightZone = this.add.zone(600, 300, 400, 600);
    rightZone.setInteractive();
    rightZone.on('pointerdown', () => {
      this.attackNearestEnemy();
    });
  }
  
  createUI() {
    // Create heart containers at the top left
    this.hearts = [];
    for (let i = 0; i < this.player.maxHealth; i++) {
      const heart = this.add.image(30 + i * 40, 30, 'heart_full').setScrollFactor(0).setDepth(100);
      heart.setScale(2);
      this.hearts.push(heart);
    }
    
    // Score text
    this.scoreText = this.add.text(this.sys.game.config.width - 20, 20, 'Score: 0', {
      font: '24px Arial',
      fill: '#ffffff'
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(100);
    
    // Coins counter
    this.coinsText = this.add.text(this.sys.game.config.width - 20, 50, 'Coins: 0', {
      font: '20px Arial',
      fill: '#ffff00'
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(100);
  }
  
  updateUI() {
    // Update hearts based on current health
    for (let i = 0; i < this.hearts.length; i++) {
      this.hearts[i].setTexture(i < this.player.health ? 'heart_full' : 'heart_empty');
    }
    
    // Update score and coins
    this.scoreText.setText(`Score: ${this.score}`);
    this.coinsText.setText(`Coins: ${this.coins}`);
  }
  
  resetGame() {
    this.score = 0;
    this.coins = 0;
    this.player.health = this.player.maxHealth;
    this.gameStartTime = this.time.now;
    this.currentWorld = 1;
    this.clearedRooms.clear();
    this.updateUI();
  }
  
  generateRoom() {
    // Clear any existing room elements
    this.walls.clear(true, true);
    this.obstacles.clear(true, true);
    this.enemies.clear(true, true);
    this.pickups.clear(true, true);
    
    // Create room background
    this.background = this.add.tileSprite(0, 0, 800, 600, 'groundStone').setOrigin(0, 0);
    
    // Create walls around the edges - less visible in isometric view
    // but still needed for collision
    this.createWalls();
    
    // Add random obstacles
    this.addObstacles();
    
    // Setup colliders
    this.setupColliders();
    
    // Room is now active
    this.roomActive = true;
  }
  
  createWalls() {
    // Top wall
    for (let x = 0; x < this.sys.game.config.width; x += 32) {
      this.walls.create(x, 0, 'rocks').setOrigin(0).refreshBody();
    }
    
    // Bottom wall
    for (let x = 0; x < this.sys.game.config.width; x += 32) {
      this.walls.create(x, this.sys.game.config.height - 32, 'rocks').setOrigin(0).refreshBody();
    }
    
    // Left wall
    for (let y = 32; y < this.sys.game.config.height - 32; y += 32) {
      this.walls.create(0, y, 'rocks').setOrigin(0).refreshBody();
    }
    
    // Right wall
    for (let y = 32; y < this.sys.game.config.height - 32; y += 32) {
      this.walls.create(this.sys.game.config.width - 32, y, 'rocks').setOrigin(0).refreshBody();
    }
  }
  
  addObstacles() {
    const numRocks = Phaser.Math.Between(5, 10);
    const numMushrooms = Phaser.Math.Between(3, 7);
    
    // Add rocks
    for (let i = 0; i < numRocks; i++) {
      const x = Phaser.Math.Between(80, this.sys.game.config.width - 80);
      const y = Phaser.Math.Between(80, this.sys.game.config.height - 80);
      
      // Check if position is clear (not too close to player)
      if (Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y) > 100) {
        this.obstacles.create(x, y, 'rocks').refreshBody();
      }
    }
    
    // Add mushrooms (decorative, non-collidable)
    for (let i = 0; i < numMushrooms; i++) {
      const x = Phaser.Math.Between(50, this.sys.game.config.width - 50);
      const y = Phaser.Math.Between(50, this.sys.game.config.height - 50);
      this.add.image(x, y, 'mushrooms').setDepth(1);
    }
  }
  
  setupColliders() {
    // Player collisions
    this.physics.add.collider(this.player, this.walls);
    this.physics.add.collider(this.player, this.obstacles);
    
    // Enemy collisions
    this.physics.add.collider(this.enemies, this.walls);
    this.physics.add.collider(this.enemies, this.obstacles);
    this.physics.add.collider(this.enemies, this.enemies);
    
    // Player-enemy collision
    this.physics.add.collider(this.player, this.enemies, this.handlePlayerEnemyCollision, null, this);
    
    // Pickup collisions
    this.physics.add.overlap(this.player, this.pickups, this.collectPickup, null, this);
  }
  
  handlePlayerEnemyCollision(player, enemy) {
    // Damage player when colliding with enemy
    this.takeDamage();
  }
  
  takeDamage() {
    if (this.time.now < this.player.lastDamageTime + 1000) return;
    
    this.player.health -= 1;
    this.player.lastDamageTime = this.time.now;
    
    // Visual feedback
    this.player.setTint(0xff0000);
    this.time.delayedCall(200, () => {
      if (this.player.active) this.player.clearTint();
    });
    
    // Sound effect
    this.sounds.death.play();
    
    // Update UI
    this.updateUI();
    
    // Check if player is dead
    if (this.player.health <= 0) {
      this.gameTime = this.time.now - this.gameStartTime;
      this.scene.start('GameOverScene', {
        score: this.score,
        time: this.gameTime
      });
    }
  }
  
  spawnEnemies(count) {
    for (let i = 0; i < count; i++) {
      // Choose a random position away from the player
      let x, y;
      do {
        x = Phaser.Math.Between(100, this.sys.game.config.width - 100);
        y = Phaser.Math.Between(100, this.sys.game.config.height - 100);
      } while (Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y) < 150);
      
      // Create skeleton enemy
      const enemy = this.enemies.create(x, y, 'skeleton_walk_S_0');
      enemy.health = 3;
      enemy.speed = Phaser.Math.Between(40, 70);
      enemy.body.setSize(enemy.width * 0.4, enemy.height * 0.3);
      enemy.body.setOffset(enemy.width * 0.3, enemy.height * 0.6);
      enemy.score = 100;
      enemy.facing = 'S'; // Default facing south
      
      // Start walking animation
      enemy.play('skeleton_walk_S');
      
      // Set depth for isometric sorting
      enemy.depth = enemy.y;
    }
  }
  
  movePlayerInDirection(dx, dy) {
    // Normalize direction
    const length = Math.sqrt(dx * dx + dy * dy);
    if (length === 0) return;
    
    dx = dx / length;
    dy = dy / length;
    
    // Set velocity
    this.player.setVelocity(dx * this.playerSpeed, dy * this.playerSpeed);
    
    // Determine facing direction (16 directions)
    const angle = Math.atan2(dy, dx);
    const degrees = Phaser.Math.RadToDeg(angle);
    
    // Convert angle to one of our 16 directions
    const direction = this.getDirectionFromAngle(degrees);
    
    // Update player's facing direction
    this.player.facing = direction;
    
    // Play walk animation for the proper direction
    if (!this.player.isAttacking) {
      this.player.play(`warrior_walk_${direction}`, true);
    }
    
    // Play footstep sound if not already playing
    if (!this.sounds.walk.isPlaying) {
      this.sounds.walk.play();
    }
    
    // Update depth for isometric sorting
    this.player.depth = this.player.y;
  }
  
  // Helper function to convert angle to 16-direction string
  getDirectionFromAngle(degrees) {
    // Normalize to 0-360
    let angle = (degrees + 360) % 360;
    
    // Direction ranges (each direction covers 22.5 degrees)
    if (angle >= 348.75 || angle < 11.25) return 'E';
    if (angle >= 11.25 && angle < 33.75) return 'NEE';
    if (angle >= 33.75 && angle < 56.25) return 'NE';
    if (angle >= 56.25 && angle < 78.75) return 'NNE';
    if (angle >= 78.75 && angle < 101.25) return 'N';
    if (angle >= 101.25 && angle < 123.75) return 'NNW';
    if (angle >= 123.75 && angle < 146.25) return 'NW';
    if (angle >= 146.25 && angle < 168.75) return 'NWW';
    if (angle >= 168.75 && angle < 191.25) return 'W';
    if (angle >= 191.25 && angle < 213.75) return 'SWW';
    if (angle >= 213.75 && angle < 236.25) return 'SW';
    if (angle >= 236.25 && angle < 258.75) return 'SSW';
    if (angle >= 258.75 && angle < 281.25) return 'S';
    if (angle >= 281.25 && angle < 303.75) return 'SSE';
    if (angle >= 303.75 && angle < 326.25) return 'SE';
    if (angle >= 326.25 && angle < 348.75) return 'SEE';
    
    return 'S'; // Default fallback
  }
  
  attackEnemy(pointer) {
    if (this.time.now < this.player.lastAttackTime + this.player.attackCooldown) return;
    
    // Set attacking flag
    this.player.isAttacking = true;
    this.player.lastAttackTime = this.time.now;
    
    // Change player direction to face mouse position
    if (pointer) {
      const angle = Phaser.Math.Angle.Between(
        this.player.x, this.player.y,
        pointer.worldX || pointer.x, pointer.worldY || pointer.y
      );
      const degrees = Phaser.Math.RadToDeg(angle);
      this.player.facing = this.getDirectionFromAngle(degrees);
      
      // Update player texture to face the right direction
      this.player.setTexture(`warrior_idle_${this.player.facing}`);
    }
    
    // Play attack sound
    this.sounds.attack.play();
    
    // Visual feedback for attack (flash player)
    this.player.setTint(0xffff00);
    this.time.delayedCall(200, () => {
      if (this.player.active) {
        this.player.clearTint();
        this.player.isAttacking = false;
        
        // Return to idle animation if not moving
        if (this.player.body.velocity.x === 0 && this.player.body.velocity.y === 0) {
          this.player.setTexture(`warrior_idle_${this.player.facing}`);
        }
      }
    });
    
    // Find enemies in attack range
    let closestEnemy = null;
    let closestDistance = this.player.attackRange;
    
    this.enemies.getChildren().forEach(enemy => {
      const distance = Phaser.Math.Distance.Between(
        this.player.x, this.player.y, enemy.x, enemy.y
      );
      
      if (distance < closestDistance) {
        closestEnemy = enemy;
        closestDistance = distance;
      }
    });
    
    // Attack closest enemy if one is found
    if (closestEnemy) {
      // Show attack effect with animation
      const glint = this.add.sprite(closestEnemy.x, closestEnemy.y, 'glint0');
      glint.setDepth(20);
      glint.play('glint');
      
      // Remove glint after animation completes
      this.time.delayedCall(600, () => {
        glint.destroy();
      });
      
      // Damage enemy
      closestEnemy.health -= 1;
      
      // Visual feedback
      closestEnemy.setTint(0xff0000);
      this.time.delayedCall(100, () => {
        if (closestEnemy.active) closestEnemy.clearTint();
      });
      
      // Check if enemy is defeated
      if (closestEnemy.health <= 0) {
        this.killEnemy(closestEnemy);
      }
    }
  }
  
  attackNearestEnemy() {
    // Mobile version of attack - automatically targets nearest enemy
    let closestEnemy = null;
    let closestDistance = 150; // Larger range for mobile
    
    this.enemies.getChildren().forEach(enemy => {
      const distance = Phaser.Math.Distance.Between(
        this.player.x, this.player.y, enemy.x, enemy.y
      );
      
      if (distance < closestDistance) {
        closestEnemy = enemy;
        closestDistance = distance;
      }
    });
    
    if (closestEnemy) {
      // Create pointer-like object with enemy position
      this.attackEnemy({ x: closestEnemy.x, y: closestEnemy.y });
    }
  }
  
  killEnemy(enemy) {
    // Play death animation for the current facing direction
    enemy.play(`skeleton_death_${enemy.facing}`);
    
    // Stop enemy movement
    enemy.body.setVelocity(0, 0);
    
    // Make non-collidable
    enemy.body.enable = false;
    
    // Play death sound
    this.sounds.death.play();
    
    // Add score
    this.score += enemy.score || 100;
    this.updateUI();
    
    // Wait for animation to complete, then remove
    this.time.delayedCall(800, () => {
      // Chance to drop gold
      if (Phaser.Math.Between(1, 100) <= 30) {
        this.spawnGold(enemy.x, enemy.y);
      }
      
      // Remove enemy
      enemy.destroy();
      
      // Check if room is cleared
      if (this.enemies.getChildren().length === 0) {
        this.handleRoomClear();
      }
    });
  }
  
  spawnGold(x, y) {
    const gold = this.pickups.create(x, y, 'goldDrop');
    gold.setValue = Phaser.Math.Between(1, 5);
    gold.depth = y + 1; // Ensure gold appears above the ground
    
    // Add loot indicator
    const indicator = this.add.image(x, y - 30, 'lootIndicator');
    indicator.setScale(0.7);
    indicator.setDepth(y + 50); // Always visible on top
    
    // Bounce animation for gold
    this.tweens.add({
      targets: gold,
      y: y - 10,
      duration: 300,
      yoyo: true,
      repeat: -1
    });
    
    // Glow effect on gold
    this.tweens.add({
      targets: gold,
      alpha: 0.7,
      duration: 500,
      yoyo: true,
      repeat: -1
    });
    
    // Link indicator to gold
    gold.indicator = indicator;
  }
  
  collectPickup(player, pickup) {
    // Remove the pickup and its indicator
    if (pickup.indicator) pickup.indicator.destroy();
    pickup.destroy();
    
    // Add coins
    this.coins += pickup.setValue || 1;
    this.updateUI();
    
    // Play sound
    this.sounds.pickup.play();
  }
  
  handleRoomClear() {
    // Increase player health slightly as reward
    if (this.player.health < this.player.maxHealth) {
      this.player.health = Math.min(this.player.maxHealth, this.player.health + 1);
      this.updateUI();
    }
    
    // Generate a new room with more enemies
    this.time.delayedCall(1000, () => {
      this.currentWorld++;
      if (this.currentWorld > this.maxWorlds) this.currentWorld = 1;
      
      this.generateRoom();
      this.spawnEnemies(this.currentWorld + 2); // More enemies each level
    });
  }
  
  update(time, delta) {
    if (!this.player.active) return;
    
    // Handle keyboard movement
    let dx = 0;
    let dy = 0;
    
    if (this.keys.A.isDown) dx -= 1;
    if (this.keys.D.isDown) dx += 1;
    if (this.keys.W.isDown) dy -= 1;
    if (this.keys.S.isDown) dy += 1;
    
    if (dx !== 0 || dy !== 0) {
      this.movePlayerInDirection(dx, dy);
    } else {
      // Stop player movement
      this.player.setVelocity(0, 0);
      
      // Switch to idle image for current direction
      if (!this.player.isAttacking) {
        this.player.anims.stop();
        this.player.setTexture(`warrior_idle_${this.player.facing}`);
      }
    }
    
    // Update enemies
    this.enemies.getChildren().forEach(enemy => {
      if (!enemy.active || enemy.anims.currentAnim?.key.includes('skeleton_death')) return;
      
      // Simple enemy AI - move toward player
      const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
      
      // Calculate velocity
      const vx = Math.cos(angle) * enemy.speed;
      const vy = Math.sin(angle) * enemy.speed;
      
      // Set velocity
      enemy.setVelocity(vx, vy);
      
      // Update facing direction using angle
      const degrees = Phaser.Math.RadToDeg(angle);
      enemy.facing = this.getDirectionFromAngle(degrees);
      
      // Update animation
      enemy.play(`skeleton_walk_${enemy.facing}`, true);
      
      // Update depth for isometric sorting
      enemy.depth = enemy.y;
    });
    
    // Sort all game objects by y position for isometric effect
    this.children.each(gameObject => {
      if (gameObject.type === 'Sprite') {
        gameObject.depth = gameObject.y;
      }
    });
  }
}

// The game configuration
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: [TitleScene, MainGameScene, GameOverScene],
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  render: {
    antialias: false, // Better for pixelated isometric graphics
    pixelArt: true,
    roundPixels: true  // Helps with crisp rendering
  }
};

// Create the game instance
const game = new Phaser.Game(config);
