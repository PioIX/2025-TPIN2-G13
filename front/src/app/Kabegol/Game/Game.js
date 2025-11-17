"use client";
import { useEffect, useRef } from "react";
import Phaser from "phaser";
import { useRouter } from "next/navigation";

export default function Game({ socket, code_room, playerNumber, userId }) {
  const gameContainer = useRef(null);
  const gameRef = useRef(null);
  const socketRef = useRef(socket);
  const playerNumberRef = useRef(playerNumber);
  const router = useRouter();

  useEffect(() => {
    socketRef.current = socket;
    playerNumberRef.current = playerNumber;
  }, [socket, playerNumber]);

  useEffect(() => {
    if (gameRef.current) return;
    if (!gameContainer.current) return;

    // Variables globales para la escena
    let player1, player2, ball;
    let boot1, boot2; // 👟 Botines
    let cursors, keys;
    let score1 = 0, score2 = 0;
    let scoreText, timerText, countdownText;
    let ground;
    let goalLeft, goalRight;
    let lastBallUpdate = 0;
    const BALL_UPDATE_RATE = 50;

    // ⏱️ Variables del timer
    let gameTime = 60;
    let gameStarted = false;
    let gameOver = false;
    let countdown = 3;
    let timerEvent;

    const config = {
      type: Phaser.AUTO,
      width: 1280,
      height: 720,
      physics: {
        default: "arcade",
        arcade: {
          gravity: { y: 750 },
          debug: false,
        },
      },
      scene: {
        preload: preload,
        create: create,
        update: update,
      },
      parent: gameContainer.current,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        orientation: "landscape"
      },
    };

    const game = new Phaser.Game(config);
    gameRef.current = game;

    function preload() {
      this.load.image("background", "/backgrounds/estadio2.png");
      this.load.image("arco", "/backgrounds/arcoNormal.png");
      this.load.image("boot", "/backgrounds/Botin.png"); // 👟 Cargar botín

      this.load.image("BotonIzq", "/backgrounds/BtnIzq.png");
      this.load.image("BotonDer", "/backgrounds/BtnDer.png");
      this.load.image("BotonJump", "/backgrounds/Jump.png");
      this.load.image("BotonKick", "/backgrounds/Kick.png");
      this.load.image("BotonStop", "/backgrounds/Stop.png");
      this.load.image("BotonContinue", "/backgrounds/Continue.png");
      this.load.image("BotonExit", "/backgrounds/Exit.png");

      this.load.image('rotate-prompt', '/backgrounds/girarCelu.png');

    }

    function createSoccerBall(scene) {
      const graphics = scene.make.graphics({ x: 0, y: 0, add: false });
      const radius = 14;

      graphics.fillStyle(0xffffff, 1);
      graphics.fillCircle(radius, radius, radius);

      graphics.fillStyle(0x000000, 1);
      graphics.beginPath();
      const pentagonRadius = radius * 0.35;
      for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI / 5) - Math.PI / 2;
        const x = radius + Math.cos(angle) * pentagonRadius;
        const y = radius + Math.sin(angle) * pentagonRadius;
        if (i === 0) {
          graphics.moveTo(x, y);
        } else {
          graphics.lineTo(x, y);
        }
      }
      graphics.closePath();
      graphics.fillPath();

      const positions = [
        { angle: 0, distance: 0.7 },
        { angle: 72, distance: 0.7 },
        { angle: 144, distance: 0.7 },
        { angle: 216, distance: 0.7 },
        { angle: 288, distance: 0.7 },
      ];

      positions.forEach(pos => {
        const angleRad = (pos.angle * Math.PI) / 180;
        const centerX = radius + Math.cos(angleRad) * radius * pos.distance;
        const centerY = radius + Math.sin(angleRad) * radius * pos.distance;
        const smallRadius = radius * 0.25;

        graphics.fillStyle(0x000000, 1);
        graphics.beginPath();
        for (let i = 0; i < 5; i++) {
          const angle = (i * 2 * Math.PI / 5) - Math.PI / 2 + angleRad;
          const x = centerX + Math.cos(angle) * smallRadius;
          const y = centerY + Math.sin(angle) * smallRadius;
          if (i === 0) {
            graphics.moveTo(x, y);
          } else {
            graphics.lineTo(x, y);
          }
        }
        graphics.closePath();
        graphics.fillPath();
      });

      graphics.lineStyle(1, 0xcccccc, 0.5);
      graphics.strokeCircle(radius, radius, radius);

      graphics.generateTexture('soccerball', radius * 2, radius * 2);
      graphics.destroy();
    }

    function formatTime(seconds) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    function create() {
      const scene = this;

      scene.isMobile = !scene.sys.game.device.os.desktop;
      scene.mobileKickPressed = false;
      this.input.addPointer(2);
      
      

      // Fondo
      const bg = scene.add.image(640, 360, "background");
      bg.setDisplaySize(1280, 720);

      createSoccerBall(scene);

      // 🔥 Suelo
      ground = scene.add.rectangle(640, 643, 1280, 10, 0x000000, 0);
      scene.physics.add.existing(ground, true);
      const groundLine = scene.add.rectangle(640, 643, 1280, 3, 0xffffff);

      // Arcos
      const arcoLeftImage = scene.add.image(25, 550, "arco");
      arcoLeftImage.setDisplaySize(80, 200);
      arcoLeftImage.setDepth(0);

      const arcoRightImage = scene.add.image(1255, 550, "arco");
      arcoRightImage.setDisplaySize(80, 200);
      arcoRightImage.setFlipX(true);
      arcoRightImage.setDepth(0);

      goalLeft = scene.add.rectangle(10, 550, 40, 160, 0xff0000, 0);
      goalRight = scene.add.rectangle(1270, 550, 40, 160, 0x0000ff, 0);
      scene.physics.add.existing(goalLeft, true);
      scene.physics.add.existing(goalRight, true);

      // Travesaños
      const travesañoIzquierda = scene.add.rectangle(12, 465, 80, 10, 0xFF0000, 0); // Parte superior izquierda
      scene.physics.add.existing(travesañoIzquierda, true);
      travesañoIzquierda.setDepth(1);

      const travesañoDerecha = scene.add.rectangle(1265, 465, 80, 10, 0xFF0000, 0); // Parte superior derecha
      scene.physics.add.existing(travesañoDerecha, true);
      travesañoDerecha.setDepth(1);

      // 👟 JUGADOR 1: Cabeza + Botín
      player1 = scene.add.circle(200, 580, 30, 0xff0000);
      player1.setDepth(2);
      scene.physics.add.existing(player1);
      player1.body.setCollideWorldBounds(true);
      player1.body.setBounce(0.3);
      player1.body.setCircle(30);
      player1.body.setMass(1.2);

      boot1 = scene.add.image(200, 628, "boot");
      boot1.setDisplaySize(55, 35);
      boot1.setDepth(1);
      boot1.setOrigin(0.5, 0.9);
      boot1.isKicking = false;

      // 👟 JUGADOR 2: Cabeza + Botín
      player2 = scene.add.circle(1080, 580, 30, 0x0000ff);
      player2.setDepth(2);
      scene.physics.add.existing(player2);
      player2.body.setCollideWorldBounds(true);
      player2.body.setBounce(0.3);
      player2.body.setCircle(30);
      player2.body.setMass(1.2);

      boot2 = scene.add.image(1080, 628, "boot");
      boot2.setDisplaySize(55, 35);
      boot2.setDepth(1);
      boot2.setOrigin(0.5, 0.9);
      boot2.setFlipX(true);
      boot2.isKicking = false;

      // 🔥 Pelota
      ball = scene.add.sprite(640, 300, 'soccerball');
      ball.setDepth(1);
      scene.physics.add.existing(ball);
      ball.body.setCollideWorldBounds(true);
      ball.body.setBounce(0.7);
      ball.body.setCircle(15);
      ball.body.setMass(0.4);
      ball.body.setDrag(50, 0);

      // Colisiones
      scene.physics.add.collider(player1, ground);
      scene.physics.add.collider(player2, ground);
      scene.physics.add.collider(ball, ground, ballGroundCollision);
      scene.physics.add.collider(player1, player2);
      scene.physics.add.collider(player1, ball, handleBallHit);
      scene.physics.add.collider(player2, ball, handleBallHit);

      // Colisiones con el travesaño
      scene.physics.add.collider(ball, travesañoIzquierda, handleBallHitTravesaño, null, scene);
      scene.physics.add.collider(ball, travesañoDerecha, handleBallHitTravesaño, null, scene);



      scene.physics.add.overlap(ball, goalLeft, () => goalScored(2), null, scene);
      scene.physics.add.overlap(ball, goalRight, () => goalScored(1), null, scene);

      // UI
      if (scene.isMobile == false) {
          scoreText = scene.add.text(640, 70, "0 - 0", {
          fontSize: "48px",
          fill: "#ffffff",
          fontFamily: "Arial",
          stroke: "#000000",
          strokeThickness: 4,
        }).setOrigin(0.5).setDepth(10);

        timerText = scene.add.text(640, 120, "1:00", {
          fontSize: "36px",
          fill: "#ffff00",
          fontFamily: "Arial",
          stroke: "#000000",
          strokeThickness: 3,
        }).setOrigin(0.5).setDepth(10);

        // 🎬 COUNTDOWN INICIAL
        countdownText = scene.add.text(640, 360, countdown.toString(), {
          fontSize: "120px",
          fill: "#ffffff",
          fontFamily: "Arial",
          stroke: "#000000",
          strokeThickness: 8,
        }).setOrigin(0.5).setDepth(20);
      } else {
        scoreText = scene.add.text(640, 100, "0 - 0", {
        fontSize: "48px",
        fill: "#ffffff",
        fontFamily: "Arial",
        stroke: "#000000",
        strokeThickness: 4,
      }).setOrigin(0.5).setDepth(10);

      timerText = scene.add.text(640, 160, "1:00", {
        fontSize: "36px",
        fill: "#ffff00",
        fontFamily: "Arial",
        stroke: "#000000",
        strokeThickness: 3,
      }).setOrigin(0.5).setDepth(10);

      // 🎬 COUNTDOWN INICIAL
      countdownText = scene.add.text(640, 360, countdown.toString(), {
        fontSize: "120px",
        fill: "#ffffff",
        fontFamily: "Arial",
        stroke: "#000000",
        strokeThickness: 8,
      }).setOrigin(0.5).setDepth(20);
      }
      // ======================== CONTROLES DEL CELULAR + LA COMPUTADORA ================ 
       // Controles Celu + Compu
      scene.moveLeft = false;
      scene.moveRight = false;
      scene.jumpPressed = false;

      if (scene.isMobile) {
        const btnAlpha = 0.9;
        const btnScale = 0.15;
        const newY = 250; 

        scene.btnIzquierda = scene.add.image(180, newY, 'BotonIzq')
            .setScale(btnScale).setInteractive().setScrollFactor(0).setAlpha(btnAlpha).setDepth(100);
        
        scene.btnIzquierda.on('pointerdown', () => { 
            scene.moveLeft = true; 
            scene.moveRight = false; // El fix para no ir a 2 lados
        });
        scene.btnIzquierda.on('pointerup', () => { scene.moveLeft = false; });

        scene.btnDerecha = scene.add.image(340, newY, 'BotonDer')
            .setScale(btnScale).setInteractive().setScrollFactor(0).setAlpha(btnAlpha).setDepth(100);
            
        scene.btnDerecha.on('pointerdown', () => { 
            scene.moveRight = true; 
            scene.moveLeft = false; // El fix
        });
        scene.btnDerecha.on('pointerup', () => { scene.moveRight = false; });

        scene.btnJump = scene.add.image(940, newY, 'BotonJump')
            .setScale(0.2).setInteractive().setScrollFactor(0).setAlpha(btnAlpha).setDepth(100);

        scene.btnJump.on('pointerdown', () => { scene.jumpPressed = true; });
        scene.btnJump.on('pointerup', () => { scene.jumpPressed = false; });
            
        scene.btnKick = scene.add.image(1100, newY, 'BotonKick')
            .setScale(0.2).setInteractive().setScrollFactor(0).setAlpha(btnAlpha).setDepth(100);
            
        scene.btnKick.on('pointerdown', () => {
            const myPlayer = playerNumberRef.current === 1 ? player1 : player2;
            const myBoot = playerNumberRef.current === 1 ? boot1 : boot2;
            // 1. Lógica local (igual que en PC)
            animateKick(myBoot, scene);
            performKick(myPlayer, ball, 700);
            
            // 2. Lógica de Red (¡NUEVO!)
            if (socketRef.current) {
                socketRef.current.emit("kick", {
                    code_room,
                    playerNumber: playerNumberRef.current, // Le dice al server quién pateó
                    force: 700
                });
            }
        });

    } else {
        // --- 2. ESTAMOS EN PC: Tus controles de teclado (sin cambios) ---
        cursors = scene.input.keyboard.createCursorKeys();
        keys = scene.input.keyboard.addKeys({
            w: Phaser.Input.Keyboard.KeyCodes.W,
            a: Phaser.Input.Keyboard.KeyCodes.A,
            d: Phaser.Input.Keyboard.KeyCodes.D,
            r: Phaser.Input.Keyboard.KeyCodes.R,
            p: Phaser.Input.Keyboard.KeyCodes.P,
        });
    }

      // 🎬 Iniciar cuenta regresiva
      if (playerNumberRef.current === 1) {
        scene.time.addEvent({
          delay: 1000,
          repeat: 2,
          callback: () => {
            countdown--;
            if (countdown > 0) {
              socketRef.current.emit("updateCountdown", { code_room, countdown });
            } else {
              socketRef.current.emit("startGameTimer", { code_room });
            }
          }
        });
      }

      // Socket listeners
      if (socketRef.current) {
        socketRef.current.on("updateCountdown", (data) => {
          countdown = data.countdown;
          countdownText.setText(countdown.toString());
        });

        socketRef.current.on("startGameTimer", () => {
          countdownText.setText("GO!");
          scene.time.delayedCall(500, () => {
            countdownText.destroy();
            gameStarted = true;
            startTimer();
          });
        });

        socketRef.current.on("timerUpdate", (data) => {
          gameTime = data.time;
          timerText.setText(formatTime(gameTime));
        });

        socketRef.current.on("gameEnded", (data) => {
          endGame(data.score1, data.score2);
        });

        socketRef.current.on("opponentMove", (data) => {
          const opponent = playerNumberRef.current === 1 ? player2 : player1;
          const opponentBoot = playerNumberRef.current === 1 ? boot2 : boot1;

          if (opponent && opponent.body && !gameOver) {
            opponent.x = data.x;
            opponent.y = data.y;
            opponent.body.setVelocity(data.vx, data.vy);

            // 👟 Actualizar botín del oponente
            opponentBoot.x = data.bootX;
            opponentBoot.y = data.bootY;
            if (data.bootAngle !== undefined) {
              opponentBoot.angle = data.bootAngle;
            }
          }
        });

        socketRef.current.on("playerKick", (data) => {
          const kickingBoot = data.playerNumber === 1 ? boot1 : boot2;
          const kickingPlayer = data.playerNumber === 1 ? player1 : player2;

          if (kickingBoot && kickingPlayer && !gameOver) {
            animateKick(kickingBoot, scene);
            performKick(kickingPlayer, ball, data.force);
          }
        });

        socketRef.current.on("ballSync", (data) => {
          if (ball && ball.body && !gameOver) {
            ball.x = data.x;
            ball.y = data.y;
            ball.body.setVelocity(data.vx, data.vy);
          }
        });

        socketRef.current.on("goalScored", (data) => {
          score1 = data.score1;
          score2 = data.score2;
          updateScoreText();
          if (!gameOver) resetPositions();
        });
      }

      function startTimer() {
        if (playerNumberRef.current === 1) {
          timerEvent = scene.time.addEvent({
            delay: 1000,
            repeat: gameTime - 1,
            callback: () => {
              gameTime--;
              socketRef.current.emit("timerTick", { code_room, time: gameTime });

              if (gameTime <= 0) {
                socketRef.current.emit("endGame", { code_room, score1, score2 });
              }
            }
          });
        }
      }

      function endGame(finalScore1, finalScore2) {
        gameOver = true;
        gameStarted = false;

        player1.body.setVelocity(0, 0);
        player2.body.setVelocity(0, 0);
        ball.body.setVelocity(0, 0);

        const overlay = scene.add.rectangle(640, 360, 1280, 720, 0x000000, 0.8);
        overlay.setDepth(50);

        const titleText = scene.add.text(640, 200, "GAME OVER", {
          fontSize: "72px",
          fill: "#ffff00",
          fontFamily: "Arial",
          stroke: "#000000",
          strokeThickness: 6,
        }).setOrigin(0.5).setDepth(51);

        const finalScoreText = scene.add.text(640, 300, `${finalScore1} - ${finalScore2}`, {
          fontSize: "64px",
          fill: "#ffffff",
          fontFamily: "Arial",
          stroke: "#000000",
          strokeThickness: 5,
        }).setOrigin(0.5).setDepth(51);

        let winnerMsg = "EMPATE!";
        let winnerColor = "#ffffff";
        if (finalScore1 > finalScore2) {
          winnerMsg = "¡ROJO GANA!";
          winnerColor = "#ff0000";
        } else if (finalScore2 > finalScore1) {
          winnerMsg = "¡AZUL GANA!";
          winnerColor = "#0000ff";
        }

        const winnerText = scene.add.text(640, 400, winnerMsg, {
          fontSize: "56px",
          fill: winnerColor,
          fontFamily: "Arial",
          stroke: "#000000",
          strokeThickness: 5,
        }).setOrigin(0.5).setDepth(51);

        const buttonBg = scene.add.rectangle(640, 520, 300, 70, 0x4CAF50);
        buttonBg.setDepth(51);
        buttonBg.setInteractive({ useHandCursor: true });

        const buttonText = scene.add.text(640, 520, "Volver al Lobby", {
          fontSize: "32px",
          fill: "#ffffff",
          fontFamily: "Arial",
        }).setOrigin(0.5).setDepth(52);

        buttonBg.on('pointerover', () => buttonBg.setFillStyle(0x66BB6A));
        buttonBg.on('pointerout', () => buttonBg.setFillStyle(0x4CAF50));
        buttonBg.on('pointerdown', () => {
          if (socketRef.current) {
            socketRef.current.emit("leaveGame", { code_room });
          }
          window.location.href = "/Kabegol/Home";
        });

        scene.time.delayedCall(10000, () => {
          router.replace("/Kabegol/Home");
        });
      }

      function ballGroundCollision(ball, ground) {
        if (ball.body.touching.down) {
          ball.body.velocity.x *= 0.85;
          if (Math.abs(ball.body.velocity.x) < 10) {
            ball.body.velocity.x = 0;
          }
        }
      }

      function animateKick(boot, scene) {
        if (boot.isKicking) return;
        boot.isKicking = true;

        
        scene.tweens.add({
          targets: boot,
          angle: boot.flipX ? 35 : -35,
          duration: 120,
          yoyo: true,
          ease: 'Power2',
          onComplete: () => {
            boot.isKicking = false;
            boot.angle = 0;
          }
        });
      }

      function performKick(player, ball, force = 700) { // 🔥 Aumentado de 500 a 700
        if (!gameStarted || gameOver) return;

        const distance = Phaser.Math.Distance.Between(player.x, player.y, ball.x, ball.y);

        // Solo patear si está cerca
        if (distance < 80) {
          // 🎯 Calcular dirección horizontal (izquierda o derecha)
          const horizontalDirection = ball.x > player.x ? 1 : -1;

          // 🔥 Calcular fuerza basada en velocidad del jugador
          const playerSpeed = Math.sqrt(
            player.body.velocity.x ** 2 +
            player.body.velocity.y ** 2
          );

          const speedBonus = playerSpeed * 0.7; // 🔥 Aumentado de 0.5 a 0.7
          const totalForce = force + speedBonus;

          // 🎯 Componentes de velocidad con ARCO ALTO
          // Horizontal: 60% de la fuerza (menos horizontal = más arco)
          let kickVelocityX = horizontalDirection * totalForce * 0.6; // 🔥 Reducido de 0.7 a 0.6

          // Vertical: SIEMPRE hacia arriba (100% de la fuerza = ARCO ALTO)
          let kickVelocityY = -totalForce * 1.0; // 🔥 Aumentado de 0.85 a 1.0

          // 💥 Modificadores especiales

          // Si está corriendo rápido, patada más plana pero potente
          if (Math.abs(player.body.velocity.x) > 150) {
            kickVelocityX *= 1.4; // 🔥 Más horizontal
            kickVelocityY *= 0.75; // Menos arco pero más potente
          }

          // Si está cayendo rápido, remate hacia abajo
          if (player.body.velocity.y > 200) {
            kickVelocityY = totalForce * 0.4; // Patea hacia abajo
            kickVelocityX *= 1.2; // Más potencia horizontal
          }

          // Si está subiendo, chilena (arco EXAGERADO)
          if (player.body.velocity.y < -100) {
            kickVelocityY *= 1.6; // 🔥 MUCHO más hacia arriba
            kickVelocityX *= 0.5; // Menos horizontal
          }

          // 💥 Aplicar velocidad
          ball.body.setVelocity(kickVelocityX, kickVelocityY);

          console.log(`⚽ PATADA! Fuerza: ${Math.round(totalForce)} | X: ${Math.round(kickVelocityX)}, Y: ${Math.round(kickVelocityY)}`);
        }
      }

      function handleBallHit(player, ball) {
        // if (!gameStarted || gameOver) return;

        // // 🎯 Dirección horizontal
        // const horizontalDirection = ball.x > player.x ? 1 : -1;

        // const force = 400;

        // // Velocidad del jugador
        // const playerSpeed = Math.sqrt(
        //   player.body.velocity.x ** 2 +
        //   player.body.velocity.y ** 2
        // );

        // const speedBonus = playerSpeed * 0.5;
        // const totalForce = force + speedBonus;

        // // 🎯 Componentes con ARCO
        // let hitVelocityX = horizontalDirection * totalForce * 0.7;
        // let hitVelocityY = -totalForce * 0.8; // Siempre hacia arriba

        // // Si está cayendo, golpe más fuerte hacia abajo
        // if (player.body.velocity.y > 150) {
        //   hitVelocityX *= 1.2;
        //   hitVelocityY *= 0.6; // Menos arco
        // }

        // ball.body.setVelocity(hitVelocityX, hitVelocityY);

        if (!gameStarted || gameOver) return;

        // Empuje MUY suave de la cabeza (para diferenciarlo de la patada)
        const horizontalDirection = ball.x > player.x ? 1 : -1;

        ball.body.setVelocity(
          horizontalDirection * 150, // Empuje suave horizontal
          -100 // Empuje suave hacia arriba
        );
      }

      function handleBallHitTravesaño(ball, travesaño) {
        // Rebote hacia abajo si la pelota golpea el travesaño
        ball.body.setVelocityY(-ball.body.velocity.y);  // Cambiar dirección vertical de la pelota
      }

      function goalScored(scoringPlayer) {
        if (!gameStarted || gameOver) return;

        if (socketRef.current && playerNumberRef.current === 1) {
          if (scoringPlayer === 1) score1++;
          else score2++;

          socketRef.current.emit("goal", {
            code_room,
            score1,
            score2,
          });

          updateScoreText();
          resetPositions();
        }
      }

      function updateScoreText() {
        scoreText.setText(`${score1} - ${score2}`);
      }

      function resetPositions() {
        player1.setPosition(200, 580);
        player1.body.setVelocity(0, 0);
        boot1.setPosition(200, 628);
        boot1.angle = 0;

        player2.setPosition(1080, 580);
        player2.body.setVelocity(0, 0);
        boot2.setPosition(1080, 628);
        boot2.angle = 0;

        ball.setPosition(640, 300);
        ball.body.setVelocity(0, 0);
      }
    }

    // 👟 Funciones auxiliares fuera de create para acceso desde update
    function animateKick(boot, scene) {
      if (boot.isKicking) return;
      boot.isKicking = true;

      scene.tweens.add({
        targets: boot,
        angle: boot.flipX ? 35 : -35,
        duration: 120,
        yoyo: true,
        ease: 'Power2',
        onComplete: () => {
          boot.isKicking = false;
          boot.angle = 0;
        }
      });
    }

    function performKick(player, ball, force = 500) {
      if (!gameStarted || gameOver) return;

      const distance = Phaser.Math.Distance.Between(player.x, player.y, ball.x, ball.y);

      if (distance < 80) {
        const angle = Phaser.Math.Angle.Between(player.x, player.y, ball.x, ball.y);
        const extraForce = player.body.velocity.y > 0 ? 1.3 : 1;

        ball.body.setVelocity(
          Math.cos(angle) * force * extraForce,
          Math.sin(angle) * force * extraForce - 150
        );
      }
    }

    function update(time) {
      const scene = this;

      if (!gameStarted || gameOver) return;

      // Rotar pelota
      if (ball && ball.body) {
        const velocityMagnitude = Math.sqrt(
          ball.body.velocity.x ** 2 + ball.body.velocity.y ** 2
        );
        if (velocityMagnitude > 10) {
          ball.angle += velocityMagnitude * 0.03;
        }
      }

      // Movimiento
      const myPlayer = playerNumberRef.current === 1 ? player1 : player2;
      const myBoot = playerNumberRef.current === 1 ? boot1 : boot2;
      const useWASD = playerNumberRef.current === 1;

      if (myPlayer && myPlayer.body) {
        const speed = 200;
        const jumpPower = -400;

        if (scene.isMobile) {
            // --- 1. LÓGICA MÓVIL ---
            if (scene.moveLeft) {
                myPlayer.body.setVelocityX(-speed);
            } else if (scene.moveRight) {
                myPlayer.body.setVelocityX(speed);
            } else {
                myPlayer.body.setVelocityX(0);
            }

            if (scene.jumpPressed && myPlayer.body.touching.down) {
                myPlayer.body.setVelocityY(jumpPower);
            }
            // (La patada ya se manejó en el 'pointerdown' del create)

        } else {
            // --- 2. LÓGICA DE TECLADO (tu código original) ---
            if (useWASD) {
                // ... (tu código de keys.a, keys.d, keys.w, keys.r) ...
                // ... (esto queda 100% igual que como lo tenías) ...
                if (keys.a.isDown) {
                    myPlayer.body.setVelocityX(-speed);
                } else if (keys.d.isDown) {
                    myPlayer.body.setVelocityX(speed);
                } else {
                    myPlayer.body.setVelocityX(0);
                }

                if (keys.w.isDown && myPlayer.body.touching.down) {
                    myPlayer.body.setVelocityY(jumpPower);
                }

                if (Phaser.Input.Keyboard.JustDown(keys.r)) {
                    animateKick(myBoot, this);
                    performKick(myPlayer, ball, 700);
                    if (socketRef.current) {
                        socketRef.current.emit("kick", {
                            code_room, playerNumber: 1, force: 700
                        });
                    }
                }

            } else {
                // ... (tu código de cursors.left, cursors.right, cursors.up, keys.p) ...
                // ... (esto queda 100% igual que como lo tenías) ...
                if (cursors.left.isDown) {
                    myPlayer.body.setVelocityX(-speed);
                } else if (cursors.right.isDown) {
                    myPlayer.body.setVelocityX(speed);
                } else {
                    myPlayer.body.setVelocityX(0);
                }

                if (cursors.up.isDown && myPlayer.body.touching.down) {
                    myPlayer.body.setVelocityY(jumpPower);
                }

                if (Phaser.Input.Keyboard.JustDown(keys.p)) {
                    animateKick(myBoot, this);
                    performKick(myPlayer, ball, 700);
                    if (socketRef.current) {
                        socketRef.current.emit("kick", {
                            code_room, playerNumber: 2, force: 700
                        });
                    }
                }
            }
        }

        // 👟 Actualizar posición del botín para seguir a la cabeza
        myBoot.x = myPlayer.x;
        myBoot.y = myPlayer.y + 48; // Ajustado para tocar mejor el piso

        if (socketRef.current) {
          socketRef.current.emit("playerMove", {
            code_room,
            playerNumber: playerNumberRef.current,
            x: myPlayer.x,
            y: myPlayer.y,
            bootX: myBoot.x,
            bootY: myBoot.y,
            vx: myPlayer.body.velocity.x,
            vy: myPlayer.body.velocity.y,
            bootAngle: myBoot.angle,
          });
        }
      }

      // Actualizar pelota (solo host)
      if (ball && ball.body && playerNumberRef.current === 1) {
        if (time - lastBallUpdate > BALL_UPDATE_RATE) {
          lastBallUpdate = time;

          if (socketRef.current) {
            socketRef.current.emit("ballUpdate", {
              code_room,
              x: ball.x,
              y: ball.y,
              vx: ball.body.velocity.x,
              vy: ball.body.velocity.y,
            });
          }
        }
      }
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.off("opponentMove");
        socketRef.current.off("ballSync");
        socketRef.current.off("goalScored");
        socketRef.current.off("updateCountdown");
        socketRef.current.off("startGameTimer");
        socketRef.current.off("timerUpdate");
        socketRef.current.off("gameEnded");
        socketRef.current.off("playerKick");
      }
      game.destroy(true);
      gameRef.current = null;
    };
  }, [code_room, playerNumber]);

  return <div ref={gameContainer} style={{ width: "100%", height: "100%" }} />;
}