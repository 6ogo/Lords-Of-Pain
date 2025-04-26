// Title Scene (Welcome Screen)
class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: "TitleScene" });
  }

  preload() {
    this.load.image("groundStone", "assets/environment/ground_stone1.png");

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

    // Room dimensions
    this.roomWidth = 1600;
    this.roomHeight = 1200;

    // For damage detection debugging
    this.lastCollisionTime = 0;
  }

  preload() {
    // Load warrior assets
    const directions = ['E', 'N', 'NE', 'NEE', 'NNE', 'NNW', 'NW', 'NWW', 'S', 'SE', 'SEE', 'SSE', 'SSW', 'SW', 'SWW', 'W'];

    // Load warrior idle animations for all directions
    directions.forEach(dir => {
      // Swap S and W sprite loading
    let spriteDir = dir;
    if (dir === 'S') spriteDir = 'W';
    });

    // Load warrior walk animations for all directions
    directions.forEach(dir => {
      for (let frame = 0; frame < 8; frame++) {
        // Swap S and W sprite loading
        let spriteDir = dir;
        if (dir === 'S') spriteDir = 'W';
        else if (dir === 'W') spriteDir = 'S';
        this.load.image(
          `warrior_walk_${dir}_${frame}`,
          `assets/playable character/warrior/warrior_armed_walk/${spriteDir}/warrior_armed_walk_${spriteDir}_${this.getAngleForDirection(dir)}_${frame}.png`
        );
      }
    });

    // Load skeleton walk animations for all directions
    directions.forEach(dir => {
      for (let frame = 0; frame < 8; frame++) {
        // Swap S and W sprite loading
        let spriteDir = dir;
        if (dir === 'S') spriteDir = 'W';
        else if (dir === 'W') spriteDir = 'S';
        this.load.image(
          `skeleton_walk_${dir}_${frame}`,
          `assets/enemy/skeleton/skeleton_default_walk/${spriteDir}/skeleton_default_walk_${spriteDir}_${this.getAngleForDirection(dir)}_${frame}.png`
        );
      }
    });

    // Load skeleton death animations for all directions
    directions.forEach(dir => {
      for (let frame = 0; frame < 8; frame++) {
        // Swap S and W sprite loading
        let spriteDir = dir;
        if (dir === 'S') spriteDir = 'W';
        else if (dir === 'W') spriteDir = 'S';
        this.load.image(
          `skeleton_death_${dir}_${frame}`,
          `assets/enemy/skeleton/skeleton_special_death/${spriteDir}/skeleton_special_death_${spriteDir}_${this.getAngleForDirection(dir)}_${frame}.png`
        );
      }
    });

    // Load gold drop for one direction (we'll reuse the same sprite)
    this.load.image('goldDrop', 'assets/prop/gold_drop/E/gold_drop_E_0.0_0.png');

    // Environment
    this.load.image('groundStone', 'assets/environment/ground_stone1.png');

    // UI
    this.load.image('highlight', 'assets/user interface/highlight/highlight_yellow.png');
    this.load.image('lootIndicator', 'assets/user interface/loot-indicator/loot_indicator_yellow.png');

    // VFX
    for (let i = 0; i < 8; i++) {
      this.load.image(`glint${i}`, `assets/vfx/glint/glint_${i}.png`);
    }
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
    // Set up dummy sound objects with empty functions to avoid errors
    this.sounds = {
      walk: { play: () => { }, isPlaying: false },
      attack: { play: () => { } },
      death: { play: () => { } },
      pickup: { play: () => { } }
    };

    this.isMobile = this.sys.game.device.os.android || this.sys.game.device.os.iOS;

    // Set world bounds to match our room size
    this.physics.world.setBounds(0, 0, this.roomWidth, this.roomHeight);

    // Create animations
    this.createAnimations();

    // Setup game elements
    this.setupPhysicsGroups();
    this.setupPlayer();
    this.setupCamera();
    this.setupInputs();
    this.createUI();

    if (data?.restart) {
      this.resetGame();
    }

    this.generateRoom();

    // Set start time for score tracking
    this.gameStartTime = this.time.now;

    // Add some initial enemies
    this.spawnEnemies(5);
  }

  createAnimations() {
    const directions = ['E', 'N', 'NE', 'NEE', 'NNE', 'NNW', 'NW', 'NWW', 'S', 'SE', 'SEE', 'SSE', 'SSW', 'SW', 'SWW', 'W'];

    // Create warrior walk animations for all directions
    directions.forEach(dir => {
      // Swap S and W animation frames
      let animDir = dir;
      if (dir === 'S') animDir = 'W';
      else if (dir === 'W') animDir = 'S';
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

  setupCamera() {
    // Make camera follow the player
    this.cameras.main.setBounds(0, 0, this.roomWidth, this.roomHeight);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    // Set a zoom level that allows seeing more of the environment
    this.cameras.main.setZoom(1.0);
  }

  setupPhysicsGroups() {
    this.walls = this.physics.add.staticGroup();
    this.obstacles = this.physics.add.staticGroup();
    this.enemies = this.physics.add.group();
    this.pickups = this.physics.add.group();
  }

  setupPlayer() {
    // Place player in the center of the room
    const startX = this.roomWidth / 2;
    const startY = this.roomHeight / 2;

    // Swap S and W default facing
    this.player = this.physics.add.sprite(startX, startY, "warrior_idle_S").setDepth(10);
    this.player.setCollideWorldBounds(true);
    this.player.health = 3;
    this.player.maxHealth = 3;
    this.player.lastDamageTime = 0;
    this.player.lastAttackTime = 0;
    this.player.attackCooldown = 500; // ms
    this.player.attackRange = 80;
    this.player.isAttacking = false;
    // Swap S and W default facing
    this.player.facing = 'S'; // Default facing south

    // Adjust hitbox size (smaller than visual size for better isometric feel)
    this.player.body.setSize(this.player.width * 0.3, this.player.height * 0.2);
    this.player.body.setOffset(this.player.width * 0.35, this.player.height * 0.7);

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
    // Create a UI container that stays fixed to the camera
    this.uiContainer = this.add.container(0, 0);
    this.uiContainer.setScrollFactor(0);
    this.uiContainer.setDepth(1000);

    // Create heart containers at the top left
    this.hearts = [];
    for (let i = 0; i < this.player.maxHealth; i++) {
      // Create hearts using graphics instead of images
      const heart = this.add.graphics();
      heart.fillStyle(0xff0000);
      heart.fillCircle(30 + i * 40, 30, 15);
      heart.setScrollFactor(0);
      this.hearts.push(heart);
      this.uiContainer.add(heart);
    }

    // Score text
    this.scoreText = this.add.text(this.sys.game.config.width - 20, 20, 'Score: 0', {
      font: '24px Arial',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(1, 0).setScrollFactor(0);
    this.uiContainer.add(this.scoreText);

    // Coins counter
    this.coinsText = this.add.text(this.sys.game.config.width - 20, 50, 'Coins: 0', {
      font: '20px Arial',
      fill: '#ffff00',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(1, 0).setScrollFactor(0);
    this.uiContainer.add(this.coinsText);

    // Create a simple minimap
    this.createSimpleMinimap();
  }

  createSimpleMinimap() {
    const minimapSize = 120;
    const padding = 10;
    const x = this.sys.game.config.width - minimapSize - padding;
    const y = padding + 60;

    // Create minimap background
    const minimapBg = this.add.rectangle(
      x + minimapSize / 2,
      y + minimapSize / 2,
      minimapSize,
      minimapSize,
      0x000000,
      0.7
    );
    minimapBg.setScrollFactor(0);
    minimapBg.setStrokeStyle(2, 0xffffff);
    this.uiContainer.add(minimapBg);

    // Create minimap contents container
    this.minimap = this.add.container(0, 0);
    this.minimap.setScrollFactor(0);
    this.uiContainer.add(this.minimap);

    // Store minimap properties for updates
    this.minimapConfig = {
      x: x,
      y: y,
      width: minimapSize,
      height: minimapSize,
      scale: {
        x: minimapSize / this.roomWidth,
        y: minimapSize / this.roomHeight
      }
    };
  }

  updateMinimap() {
    // Clear previous minimap content
    this.minimap.removeAll(true);

    // Player dot (green)
    const playerX = this.minimapConfig.x + (this.player.x * this.minimapConfig.scale.x);
    const playerY = this.minimapConfig.y + (this.player.y * this.minimapConfig.scale.y);
    const playerDot = this.add.circle(playerX, playerY, 4, 0x00ff00);
    this.minimap.add(playerDot);

    // Enemy dots (red)
    this.enemies.getChildren().forEach(enemy => {
      if (enemy.active && !enemy.anims.currentAnim?.key.includes('skeleton_death')) {
        const enemyX = this.minimapConfig.x + (enemy.x * this.minimapConfig.scale.x);
        const enemyY = this.minimapConfig.y + (enemy.y * this.minimapConfig.scale.y);
        const enemyDot = this.add.circle(enemyX, enemyY, 2, 0xff0000);
        this.minimap.add(enemyDot);
      }
    });

    // Wall outlines
    const wallColor = 0xffffff;
    const wallThickness = 64 * this.minimapConfig.scale.x;

    // Top wall
    const topWall = this.add.rectangle(
      this.minimapConfig.x + this.minimapConfig.width / 2,
      this.minimapConfig.y + wallThickness / 2,
      this.minimapConfig.width,
      wallThickness,
      wallColor
    );
    this.minimap.add(topWall);

    // Bottom wall
    const bottomWall = this.add.rectangle(
      this.minimapConfig.x + this.minimapConfig.width / 2,
      this.minimapConfig.y + this.minimapConfig.height - wallThickness / 2,
      this.minimapConfig.width,
      wallThickness,
      wallColor
    );
    this.minimap.add(bottomWall);

    // Left wall
    const leftWall = this.add.rectangle(
      this.minimapConfig.x + wallThickness / 2,
      this.minimapConfig.y + this.minimapConfig.height / 2,
      wallThickness,
      this.minimapConfig.height,
      wallColor
    );
    this.minimap.add(leftWall);

    // Right wall
    const rightWall = this.add.rectangle(
      this.minimapConfig.x + this.minimapConfig.width - wallThickness / 2,
      this.minimapConfig.y + this.minimapConfig.height / 2,
      wallThickness,
      this.minimapConfig.height,
      wallColor
    );
    this.minimap.add(rightWall);
  }

  updateUI() {
    // Update hearts based on current health
    for (let i = 0; i < this.hearts.length; i++) {
      this.hearts[i].clear();
      if (i < this.player.health) {
        this.hearts[i].fillStyle(0xff0000);
      } else {
        this.hearts[i].fillStyle(0x444444);
      }
      this.hearts[i].fillCircle(30 + i * 40, 30, 15);
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

    // Create room background - tiled to fill the larger room
    this.background = this.add.tileSprite(0, 0, this.roomWidth, this.roomHeight, 'groundStone')
      .setOrigin(0, 0)
      .setDepth(0);

    // Create visible walls around the room
    this.createWalls();

    // Add random obstacles throughout the room
    this.addObstacles();

    // Setup colliders
    this.setupColliders();

    // Room is now active
    this.roomActive = true;
  }

  createWalls() {
    // Wall thickness
    const wallThickness = 64;

    // Load gold drops for the walls with a visual effect
    const createWallSegment = (x, y, width, height) => {
      // Create physics body for collision
      const wall = this.walls.create(x + width / 2, y + height / 2, null);
      wall.setSize(width, height);
      wall.setImmovable(true);
      wall.refreshBody();

      // Create visible wall elements
      for (let wx = x; wx < x + width; wx += 32) {
        for (let wy = y; wy < y + height; wy += 32) {
          const wallSprite = this.add.sprite(wx, wy, 'goldDrop');
          wallSprite.setScale(2);
          wallSprite.setTint(0xff0000); // Red color for walls
          wallSprite.depth = wy; // Set depth based on y position
        }
      }
    };

    // Top wall
    createWallSegment(0, 0, this.roomWidth, wallThickness);

    // Bottom wall
    createWallSegment(0, this.roomHeight - wallThickness, this.roomWidth, wallThickness);

    // Left wall
    createWallSegment(0, wallThickness, wallThickness, this.roomHeight - (wallThickness * 2));

    // Right wall
    createWallSegment(this.roomWidth - wallThickness, wallThickness, wallThickness, this.roomHeight - (wallThickness * 2));
  }

  addObstacles() {
    // Add obstacles that resemble rocks or pillars
    const numObstacles = Phaser.Math.Between(12, 20);

    for (let i = 0; i < numObstacles; i++) {
      // Choose random positions throughout the large room, away from the player
      let x, y;
      do {
        x = Phaser.Math.Between(100, this.roomWidth - 100);
        y = Phaser.Math.Between(100, this.roomHeight - 100);
      } while (Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y) < 150);

      // Create physics body for collision
      const obstacle = this.obstacles.create(x, y, null);
      obstacle.setSize(50, 50);
      obstacle.setImmovable(true);
      obstacle.refreshBody();

      // Create visible obstacle with multiple sprites for a pillar/rock appearance
      const size = Phaser.Math.Between(2, 3);
      const color = Phaser.Math.Between(0, 1) === 0 ? 0x8888ff : 0x88ff88; // Blue or green obstacles

      // Create a stack of sprites to make a pillar/rock
      for (let j = 0; j < size; j++) {
        const obstacleSprite = this.add.sprite(
          x + Phaser.Math.Between(-5, 5),
          y + Phaser.Math.Between(-5, 5),
          'goldDrop'
        );
        obstacleSprite.setScale(2.5);
        obstacleSprite.setTint(color);
        obstacleSprite.depth = y + j; // Stack the sprites with increasing depth
      }
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
    // Only trigger collision if enemy is active and not dying
    if (!enemy.active || enemy.anims.currentAnim?.key.includes('skeleton_death')) return;

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
      // Choose random positions throughout the large room, away from the player
      let x, y;
      do {
        x = Phaser.Math.Between(100, this.roomWidth - 100);
        y = Phaser.Math.Between(100, this.roomHeight - 100);
      } while (Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y) < 200);

      // Create skeleton enemy
      const enemy = this.enemies.create(x, y, 'skeleton_walk_S_0');
      enemy.health = 3;
      enemy.speed = Phaser.Math.Between(40, 70);

      // Smaller hitbox for better collision detection
      enemy.body.setSize(enemy.width * 0.3, enemy.height * 0.2);
      enemy.body.setOffset(enemy.width * 0.35, enemy.height * 0.7);

      enemy.score = 100;
      // Swap S and W default facing
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

      // Simple enemy AI - move toward player if within certain distance
      const distanceToPlayer = Phaser.Math.Distance.Between(
        enemy.x, enemy.y, this.player.x, this.player.y
      );

      if (distanceToPlayer < 400) { // Only chase player if within reasonable distance
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
      } else {
        // Stop movement if player is too far away
        enemy.setVelocity(0, 0);
      }

      // Update depth for isometric sorting
      enemy.depth = enemy.y;
    });

    // Sort all game objects by y position for isometric effect
    this.children.each(gameObject => {
      if (gameObject.type === 'Sprite') {
        gameObject.depth = gameObject.y;
      }
    });

    // Update minimap
    this.updateMinimap();
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