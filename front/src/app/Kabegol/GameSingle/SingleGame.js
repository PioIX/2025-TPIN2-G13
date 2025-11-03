"use client";
import { useEffect, useRef } from "react";
import Phaser from "phaser";
import { useRouter } from "next/navigation";

export default function GameSingle({ userId, imageProfile }) {
  const gameContainer = useRef(null);
  const gameRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    if (gameRef.current) return;
    if (!gameContainer.current) return;

    // Variables globales
    let player, cpu, ball, boot1, bootCPU;
    let cursors, keys;
    let score1 = 0, scoreCPU = 0;
    let scoreText, timerText;
    let ground, goalLeft, goalRight;
    let gameTime = 60;
    let gameStarted = false;
    let gameOver = false;

    const config = {
      type: Phaser.AUTO,
      width: 1280,
      height: 720,
      physics: {
        default: "arcade",
        arcade: {
          gravity: { y: 600 },
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
      },
    };

    const game = new Phaser.Game(config);
    gameRef.current = game;

    function preload() {
      this.load.image("background", "/backgrounds/estadio1.png");
      this.load.image("arco", "/backgrounds/arcoNormal.png");
      this.load.image("boot", "/backgrounds/Botin.png");
      // Cargar foto de perfil si existe
    }

    function create() {
      const scene = this;

      // Fondo
      const bg = scene.add.image(640, 360, "background");
      bg.setDisplaySize(1280, 720);

      // Suelo
      ground = scene.add.rectangle(640, 643, 1280, 10, 0x000000, 0);
      scene.physics.add.existing(ground, true);

      // Arcos
      const arcoLeft = scene.add.image(25, 550, "arco");
      arcoLeft.setDisplaySize(80, 200);
      arcoLeft.setDepth(0);

      const arcoRight = scene.add.image(1255, 550, "arco");
      arcoRight.setDisplaySize(80, 200);
      arcoRight.setFlipX(true);
      arcoRight.setDepth(0);

      goalLeft = scene.add.rectangle(20, 590, 40, 160, 0xff0000, 0);
      goalRight = scene.add.rectangle(1260, 590, 40, 160, 0x0000ff, 0);
      scene.physics.add.existing(goalLeft, true);
      scene.physics.add.existing(goalRight, true);

      // JUGADOR (tú)
      player = scene.add.circle(200, 580, 30, 0xff0000);
      player.setDepth(2);
      scene.physics.add.existing(player);
      player.body.setCollideWorldBounds(true);
      player.body.setBounce(0.3);
      player.body.setCircle(30);
      player.body.setMass(1.2);

      boot1 = scene.add.image(200, 628, "boot");
      boot1.setDisplaySize(55, 35);
      boot1.setDepth(1);
      boot1.setOrigin(0.5, 0.9);
      boot1.isKicking = false;

      // CPU (oponente)
      cpu = scene.add.circle(1080, 580, 30, 0x0000ff);
      cpu.setDepth(2);
      scene.physics.add.existing(cpu);
      cpu.body.setCollideWorldBounds(true);
      cpu.body.setBounce(0.3);
      cpu.body.setCircle(30);
      cpu.body.setMass(1.2);

      bootCPU = scene.add.image(1080, 628, "boot");
      bootCPU.setDisplaySize(55, 35);
      bootCPU.setDepth(1);
      bootCPU.setOrigin(0.5, 0.9);
      bootCPU.setFlipX(true);
      bootCPU.isKicking = false;

      // Pelota
      ball = scene.add.circle(640, 300, 15, 0xffffff);
      ball.setDepth(1);
      scene.physics.add.existing(ball);
      ball.body.setCollideWorldBounds(true);
      ball.body.setBounce(0.7);
      ball.body.setCircle(15);
      ball.body.setMass(0.4);
      ball.body.setDrag(50, 0);

      // Colisiones
      scene.physics.add.collider(player, ground);
      scene.physics.add.collider(cpu, ground);
      scene.physics.add.collider(ball, ground);
      scene.physics.add.collider(player, cpu);
      scene.physics.add.collider(player, ball);
      scene.physics.add.collider(cpu, ball);

      scene.physics.add.overlap(ball, goalLeft, () => goalScored('cpu'), null, scene);
      scene.physics.add.overlap(ball, goalRight, () => goalScored('player'), null, scene);

      // UI
      scoreText = scene.add.text(640, 30, "0 - 0", {
        fontSize: "48px",
        fill: "#ffffff",
        fontFamily: "Arial",
        stroke: "#000000",
        strokeThickness: 4,
      }).setOrigin(0.5).setDepth(10);

      timerText = scene.add.text(640, 90, "1:00", {
        fontSize: "36px",
        fill: "#ffff00",
        fontFamily: "Arial",
        stroke: "#000000",
        strokeThickness: 3,
      }).setOrigin(0.5).setDepth(10);

      // Controles
      cursors = scene.input.keyboard.createCursorKeys();
      keys = scene.input.keyboard.addKeys({
        w: Phaser.Input.Keyboard.KeyCodes.W,
        a: Phaser.Input.Keyboard.KeyCodes.A,
        d: Phaser.Input.Keyboard.KeyCodes.D,
        r: Phaser.Input.Keyboard.KeyCodes.R,
      });

      // Iniciar juego después de 3 segundos
      scene.time.delayedCall(3000, () => {
        gameStarted = true;
        startTimer(scene);
      });

      function startTimer(scene) {
        scene.time.addEvent({
          delay: 1000,
          repeat: gameTime - 1,
          callback: () => {
            gameTime--;
            const mins = Math.floor(gameTime / 60);
            const secs = gameTime % 60;
            timerText.setText(`${mins}:${secs.toString().padStart(2, '0')}`);

            if (gameTime <= 0) {
              endGame();
            }
          }
        });
      }

      function goalScored(scorer) {
        if (!gameStarted || gameOver) return;

        if (scorer === 'player') score1++;
        else scoreCPU++;

        scoreText.setText(`${score1} - ${scoreCPU}`);
        resetPositions();
      }

      function endGame() {
        gameOver = true;
        gameStarted = false;

        // Frenar todo
        player.body.setVelocity(0, 0);
        cpu.body.setVelocity(0, 0);
        ball.body.setVelocity(0, 0);

        // Pantalla Game Over
        const overlay = scene.add.rectangle(640, 360, 1280, 720, 0x000000, 0.8);
        overlay.setDepth(50);

        let winnerMsg = "EMPATE!";
        if (score1 > scoreCPU) winnerMsg = "¡GANASTE!";
        else if (scoreCPU > score1) winnerMsg = "¡PERDISTE!";

        const winnerText = scene.add.text(640, 300, winnerMsg, {
          fontSize: "72px",
          fill: "#ffff00",
          fontFamily: "Arial",
          stroke: "#000000",
          strokeThickness: 6,
        }).setOrigin(0.5).setDepth(51);

        // Botón manual para volver
        const buttonBg = scene.add.rectangle(640, 500, 300, 70, 0x4CAF50);
        buttonBg.setDepth(51);
        buttonBg.setInteractive({ useHandCursor: true });

        const buttonText = scene.add.text(640, 500, "Volver al Lobby", {
          fontSize: "32px",
          fill: "#ffffff",
          fontFamily: "Arial",
        }).setOrigin(0.5).setDepth(52);

        buttonBg.on("pointerover", () => buttonBg.setFillStyle(0x66BB6A));
        buttonBg.on("pointerout", () => buttonBg.setFillStyle(0x4CAF50));
        buttonBg.on("pointerdown", () => {
          router.replace("/Kabegol/Home");
        });

        // 🔁 Auto volver al lobby luego de 3 segundos
        scene.time.delayedCall(3000, () => {
          router.replace("/Kabegol/Home");
        });
      }


      function resetPositions() {
        player.setPosition(200, 580);
        player.body.setVelocity(0, 0);
        cpu.setPosition(1080, 580);
        cpu.body.setVelocity(0, 0);
        ball.setPosition(640, 300);
        ball.body.setVelocity(0, 0);
      }
    }

    function update(time) {
      if (!gameStarted || gameOver) return;

      // 🎮 Controles del JUGADOR
      if (keys.a.isDown) {
        player.body.setVelocityX(-250);
      } else if (keys.d.isDown) {
        player.body.setVelocityX(250);
      } else {
        player.body.setVelocityX(0);
      }

      if (keys.w.isDown && player.body.touching.down) {
        player.body.setVelocityY(-450);
      }

      // Actualizar botín
      boot1.x = player.x;
      boot1.y = player.y + 48;

      // 🤖 IA del CPU (básica)
      const distanceToBall = Phaser.Math.Distance.Between(cpu.x, cpu.y, ball.x, ball.y);

      // Seguir la pelota
      if (ball.x < cpu.x - 20) {
        cpu.body.setVelocityX(-200);
      } else if (ball.x > cpu.x + 20) {
        cpu.body.setVelocityX(200);
      } else {
        cpu.body.setVelocityX(0);
      }

      // Saltar si la pelota está en el aire cerca
      if (distanceToBall < 100 && ball.y < cpu.y - 50 && cpu.body.touching.down) {
        cpu.body.setVelocityY(-450);
      }

      // Actualizar botín CPU
      bootCPU.x = cpu.x;
      bootCPU.y = cpu.y + 48;
    }

    return () => {
      game.destroy(true);
      gameRef.current = null;
    };
  }, [userId, imageProfile]);

  return <div ref={gameContainer} style={{ width: "100%", height: "100%" }} />;
}