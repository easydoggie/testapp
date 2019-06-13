var config = {
  type: Phaser.AUTO,
    backgroundColor: '0xd3d3d3',
  scale: {
    mode: Phaser.DOM.FIT,
    parent: 'phaser-example',
    width: 800,
    height: 600,
    min: {
      width: 400,
      height: 300
    },
    max: {
      width: 1600,
      height: 1200
    }
  },
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
      gravity: { y: 0 }
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  } 
};

var game = new Phaser.Game(config);

function preload() {
  this.load.spritesheet('ship2', 'assets/Assault_Squad_Duo_PNGBoard.png',
    {frameWidth: 24,
     frameHeight: 24,
     spacing: 8,
     margin: 4
    });
  this.load.image('ship', 'assets/spaceShips_001.png');
  this.load.image('otherPlayer', 'assets/enemyBlack5.png');
  this.load.image('star', 'assets/star_gold.png');
  this.load.image('button', 'assets/icons8-start-100.png');
}

function create() {
  var self = this;
  this.socket = io();
  this.otherPlayers = this.physics.add.group();

  this.anims.create({
      key: 'red',
      frames: this.anims.generateFrameNumbers('ship2', {
          start: 1,
          end: 1
      }),
      frameRate: 10,
      repeat: -1
      });
  this.anims.create({
      key: 'blue',
      frames: this.anims.generateFrameNumbers('ship2', {
          start: 4,
          end: 4
      }),
      frameRate: 10,
      repeat: -1
      });
  //this.physics.add.sprite(100, 100, 'ship2').anims.play('normal');

  this.socket.on('currentPlayers', function (players) {
    Object.keys(players).forEach(function (id) {
      if (players[id].playerId === self.socket.id) {
        addPlayer(self, players[id]);
      } else {
        addOtherPlayers(self, players[id]);
      }
    });
  });
  this.socket.on('newPlayer', function (playerInfo) {
    addOtherPlayers(self, playerInfo);
  });
  this.socket.on('disconnect', function (playerId) {
    self.otherPlayers.getChildren().forEach(function (otherPlayer) {
      if (playerId === otherPlayer.playerId) {
        otherPlayer.destroy();
      }
    });
  });
  this.socket.on('playerMoved', function (playerInfo) {
    self.otherPlayers.getChildren().forEach(function (otherPlayer) {
      if (playerInfo.playerId === otherPlayer.playerId) {
        otherPlayer.setRotation(playerInfo.rotation);
        otherPlayer.setPosition(playerInfo.x, playerInfo.y);
      }
    });
  });

  if (this.sys.game.device.os.android ||
      this.sys.game.device.os.iOS) {
    this.input.addPointer(2);
    this.input.topOnly = true;
    this.cursors = {
        'up': {},
        'left': {},
        'right': {},
        'down': {},
    }

    const pointerDown = key => {
        this.cursors[key].isDown = true;
    }
    const pointerUp = key => {
        this.cursors[key].isDown = false;
    }

    const WIDTH = 100;
    const HEIGHT = 100;
    const GUTTER = 50;

    const createBtn = (key, x, y, angle, width=WIDTH, height=HEIGHT) => {
        this.add.image(x, y, 'button')
        //this.add.rectangle(x, y, width, height, 0xff0000, 1)
            .setOrigin(0.5, 0.5)
            .setScrollFactor(0)
            .setInteractive()
            .setAngle(angle)
            .on('pointerdown', () => pointerDown(key))
            .on('pointerup', () => pointerUp(key))
        }

    const BTN_Y = this.sys.game.config.height - HEIGHT - GUTTER;

    createBtn('left', GUTTER, BTN_Y, 180);
    createBtn('right', WIDTH + 2 * GUTTER, BTN_Y, 0);
    createBtn('up', this.sys.game.config.width / 2, BTN_Y, 270);
    //createBtn('down', config.width - WIDTH - GUTTER, BTN_Y);
  } else {
      this.cursors = this.input.keyboard.createCursorKeys();
  }

  this.blueScoreText = this.add.text(16, 16, '', { fontSize: '32px', fill: '#0000FF' });
  this.redScoreText = this.add.text(584, 16, '', { fontSize: '32px', fill: '#FF0000' });
  
  this.socket.on('scoreUpdate', function (scores) {
    self.blueScoreText.setText('Blue: ' + scores.blue);
    self.redScoreText.setText('Red: ' + scores.red);
  });

  this.socket.on('starLocation', function (starLocation) {
    if (self.star) self.star.destroy();
    self.star = self.physics.add.image(starLocation.x, starLocation.y, 'star');
    self.physics.add.overlap(self.ship, self.star, function () {
      this.socket.emit('starCollected');
    }, null, self);
  });

}

function addPlayer(self, playerInfo) {
  //self.ship = self.physics.add.image(playerInfo.x, playerInfo.y, 'ship').setOrigin(0.5, 0.5).setDisplaySize(53, 40);

  if (playerInfo.team === 'blue') {
    //self.ship.setTint(0x0000ff);
  self.ship = self.physics.add.sprite(playerInfo.x, playerInfo.y, 'ship2').anims.play('blue').setOrigin(0.5, 0.5).setDisplaySize(53, 40);
  } else {
    //self.ship.setTint(0xff0000);
  self.ship = self.physics.add.sprite(playerInfo.x, playerInfo.y, 'ship2').anims.play('red').setOrigin(0.5, 0.5).setDisplaySize(53, 40);
  }

  //text = self.add.text(0, 0, playerInfo.name);
  //text.setOrigin(0.5, 0.5);
  //container = self.add.container(playerInfo.x, playerInfo.y);
  //container.add(self.ship);
  //container.add(text);

  self.ship.setDrag(100);
  self.ship.setAngularDrag(100);
  self.ship.setMaxVelocity(200);
}

function addOtherPlayers(self, playerInfo) {
  const otherPlayer = self.add.sprite(playerInfo.x, playerInfo.y, 'otherPlayer').setOrigin(0.5, 0.5).setDisplaySize(53, 40);
  if (playerInfo.team === 'blue') {
    otherPlayer.setTint(0x0000ff);
  } else {
    otherPlayer.setTint(0xff0000);
  }
  otherPlayer.playerId = playerInfo.playerId;
  self.otherPlayers.add(otherPlayer);
}

function update() {
  if (this.ship) {
    if (this.cursors.left.isDown) {
      this.ship.setAngularVelocity(-150);
    } else if (this.cursors.right.isDown) {
      this.ship.setAngularVelocity(150);
    } else {
      this.ship.setAngularVelocity(0);
    }
  
    if (this.cursors.up.isDown) {
      this.physics.velocityFromRotation(this.ship.rotation - 1.5, 100, this.ship.body.acceleration);
    } else {
      this.ship.setAcceleration(0);
    }
  
    this.physics.world.wrap(this.ship, 5);

    // emit player movement
    var x = this.ship.x;
    var y = this.ship.y;
    var r = this.ship.rotation;
    if (this.ship.oldPosition && (x !== this.ship.oldPosition.x || y !== this.ship.oldPosition.y || r !== this.ship.oldPosition.rotation)) {
      this.socket.emit('playerMovement', { x: this.ship.x, y: this.ship.y, rotation: this.ship.rotation });
    }
    // save old position data
    this.ship.oldPosition = {
      x: this.ship.x,
      y: this.ship.y,
      rotation: this.ship.rotation
    };
  }
}

