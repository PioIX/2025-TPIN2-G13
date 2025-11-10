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
    let scoreText, timerText, countdownText;
    let countdown = 3
    let ground, goalLeft, goalRight;
    let gameTime = 60;
    let gameStarted = false;
    let gameOver = false;
    let goalJustScored = false;
    let CPU, cpuState; // declaralos arriba del todo
    

    const config = {
      type: Phaser.AUTO,
      width: 1280,
      height: 700,
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

    // ======= FUNCIONES AUXILIARES CPU =======

    function clamp(v, a, b) {
      return Math.max(a, Math.min(b, v));
    }

    function predictLandingX(ball, gravityY, groundY, fieldLeft, fieldRight) {
      const g = gravityY;
      const y = ball.y;
      const vy = ball.body.velocity.y;
      const yGround = groundY;

      const a = 0.5 * g;
      const b = vy;
      const c = y - yGround;

      const disc = b * b - 4 * a * c;
      if (disc < 0) return ball.x;

      const t1 = (-b + Math.sqrt(disc)) / (2 * a);
      const t2 = (-b - Math.sqrt(disc)) / (2 * a);
      const t = Math.max(t1, t2);

      if (!isFinite(t) || t <= 0) return ball.x;

      const xPred = ball.x + ball.body.velocity.x * t;
      return clamp(xPred, fieldLeft + 20, fieldRight - 20);
    }

    function isDanger(ball, goalRightX, dangerRadius) {
      const nearRight = (ball.x > goalRightX - dangerRadius);
      const comingToRight = ball.body.velocity.x > -20;
      return nearRight && comingToRight;
    }

    function create() {
      const scene = this;


      createSoccerBall(scene);

      // Fondo
      const bg = scene.add.image(640, 360, "background");
      bg.setDisplaySize(1280, 720);

      // Suelo
      ground = scene.add.rectangle(640, 643, 1280, 10, 0x000000, 0);
      scene.physics.add.existing(ground, true);

      //Arcos
      const arcoLeftImage = scene.add.image(25, 550, "arco");
      arcoLeftImage.setDisplaySize(80, 200);
      arcoLeftImage.setDepth(0);

      const arcoRightImage = scene.add.image(1255, 550, "arco");
      arcoRightImage.setDisplaySize(80, 200);
      arcoRightImage.setFlipX(true);
      arcoRightImage.setDepth(0);

      goalLeft = scene.add.rectangle(20, 550, 40, 160, 0xff0000, 0);
      goalRight = scene.add.rectangle(1260, 550, 40, 160, 0x0000ff, 0);
      scene.physics.add.existing(goalLeft, true);
      scene.physics.add.existing(goalRight, true);

      // Travesaños
      const travesañoIzquierda = scene.add.rectangle(12, 465, 80, 10, 0xFF0000, 0); // Parte superior izquierda
      scene.physics.add.existing(travesañoIzquierda, true);
      travesañoIzquierda.setDepth(1);

      const travesañoDerecha = scene.add.rectangle(1265, 465, 80, 10, 0xFF0000, 0); // Parte superior derecha
      scene.physics.add.existing(travesañoDerecha, true);
      travesañoDerecha.setDepth(1);

      // Pelota
      ball = scene.add.sprite(640, 300, 'soccerball');
      ball.setDepth(1);
      scene.physics.add.existing(ball);
      ball.body.setCollideWorldBounds(true);
      ball.body.setBounce(0.7);
      ball.body.setCircle(15);
      ball.body.setMass(0.4);
      ball.body.setDrag(50, 0);

      // Colisiones con el travesaño
      scene.physics.add.collider(ball, travesañoIzquierda, handleBallHitTravesaño, null, scene);
      scene.physics.add.collider(ball, travesañoDerecha, handleBallHitTravesaño, null, scene);

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

      // === IA CPU: estado y constantes (sin cambiar velocidades base) ===
      CPU = {
        // campo y referencias
        fieldLeft: 0,
        fieldRight: 1280,
        groundY: 628,           // aprox: 643 (suelo) - 15 (radio pelota)
        goalRightX: 1260,       // arco del CPU
        homeX: 1040,            // “posición base” del CPU
        defendZoneX: 1080,      // línea de defensa por delante del arco

        // lógica
        thinkMs: 120,           // “tiempo de reacción” humano
        lastThink: 0,
        deadzone: 14,           // anti-oscilación
        hysteresis: 8,
        interceptTol: 18,       // tolerancia al x de intercepción
        dangerRadius: 220,      // si la pelota está cerca del arco propio
        closeBallDist: 86,      // rango para intentar patada
        airBlockDist: 140,      // rango para salto de bloqueo
        headChance: 0.35        // chance de cabecear en vez de esperar
      };

      cpuState = {
        mode: 'INTERCEPT',      // INTERCEPT | DEFEND | CLEAR | HOLD
        targetX: CPU.homeX,
        lockUntil: 0,           // evita cambiar de idea muy seguido
        rndBias: (Math.random() * 40) - 20  // sesgo sutil para “personalidad”
      };

      // util: clamp
      function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

      // Predice dónde cae la pelota (x) suponiendo física Arcade
      function predictLandingX() {
        const g = scene.physics.world.gravity.y;        // ~600
        const y = ball.y;
        const vy = ball.body.velocity.y;
        const yGround = CPU.groundY;

        // Si ya va subiendo poco, igual predecimos el próximo cruce hacia abajo
        const a = 0.5 * g;
        const b = vy;
        const c = y - yGround;

        // t = tiempo hasta tocar “piso” (solución positiva de la cuadrática)
        const disc = b * b - 4 * a * c;
        if (disc < 0) return ball.x; // fallback seguro

        const t1 = (-b + Math.sqrt(disc)) / (2 * a);
        const t2 = (-b - Math.sqrt(disc)) / (2 * a);
        const t = Math.max(t1, t2);

        if (!isFinite(t) || t <= 0) return ball.x;

        const xPred = ball.x + ball.body.velocity.x * t;
        return clamp(xPred, CPU.fieldLeft + 20, CPU.fieldRight - 20);
      }

      // ¿La pelota amenaza el arco del CPU?
      function isDanger() {
        const nearRight = (ball.x > CPU.goalRightX - CPU.dangerRadius);
        const comingToRight = ball.body.velocity.x > -20; // no se aleja fuerte
        return nearRight && comingToRight;
      }




      // Colisiones
      scene.physics.add.collider(player, ground);
      scene.physics.add.collider(cpu, ground);
      scene.physics.add.collider(ball, ground);
      scene.physics.add.collider(player, cpu);
      scene.physics.add.collider(cpu, ball);

      scene.physics.add.collider(player, ball, handleBallHit, null, scene);

      function handleBallHit(player, ball) {
        if (!gameStarted || gameOver) return;
        const horizontalDirection = ball.x > player.x ? 1 : -1;

        ball.body.setVelocity(
          horizontalDirection * 150, // empuje suave horizontal
          -100                       // empuje suave hacia arriba
        );
      }


      scene.physics.add.overlap(ball, goalLeft, () => goalScored('cpu'), null, scene);
      scene.physics.add.overlap(ball, goalRight, () => goalScored('player'), null, scene);

      function handleBallHitTravesaño(ball, travesaño) {
        // Rebote hacia abajo si la pelota golpea el travesaño
        ball.body.setVelocityY(-ball.body.velocity.y);  // Cambiar dirección vertical de la pelota
      }

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

      // 🎬 COUNTDOWN INICIAL
      countdownText = scene.add.text(640, 360, countdown.toString(), {
        fontSize: "120px",
        fill: "#ffffff",
        fontFamily: "Arial",
        stroke: "#000000",
        strokeThickness: 8,
      }).setOrigin(0.5).setDepth(20);

      // Controles
      cursors = scene.input.keyboard.createCursorKeys();
      keys = scene.input.keyboard.addKeys({
        w: Phaser.Input.Keyboard.KeyCodes.W,
        a: Phaser.Input.Keyboard.KeyCodes.A,
        d: Phaser.Input.Keyboard.KeyCodes.D,
        r: Phaser.Input.Keyboard.KeyCodes.R,
      });

      // Iniciar juego después de 3 segundos
      scene.time.addEvent({
        delay: 1000,
        repeat: 2,
        callback: () => {
          countdown--;
          if (countdown > 0) {
            countdownText.setText(countdown.toString());
          } else {
            countdownText.setText("GO!");
            scene.time.delayedCall(500, () => {
              countdownText.destroy();
              gameStarted = true;
              startTimer(scene);
            });
          }
        }
      });

      function startTimer(scene) {
        scene.time.addEvent({
          delay: 1000,
          repeat: gameTime - 1,
          callback: () => {
            gameTime--;
            timerText.setText(formatTime(gameTime));

            if (gameTime <= 0) {
              endGame(scene);
            }
          }
        });
      }


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
        if (!gameStarted || gameOver || goalJustScored) return;
        goalJustScored = true;
        if (scorer === 'player') score1++;
        else scoreCPU++;
        scoreText.setText(`${score1} - ${scoreCPU}`);
        resetPositions();
        // Permitir nuevo gol después de 1 segundo
        scene.time.delayedCall(1000, () => { goalJustScored = false; });
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

        // Título GAME OVER
        const titleText = scene.add.text(640, 180, "GAME OVER", {
          fontSize: "72px",
          fill: "#ffff00",
          fontFamily: "Arial",
          stroke: "#000000",
          strokeThickness: 6,
        }).setOrigin(0.5).setDepth(51);

        // Score final
        const finalScoreText = scene.add.text(640, 270, `${score1} - ${scoreCPU}`, {
          fontSize: "64px",
          fill: "#ffffff",
          fontFamily: "Arial",
          stroke: "#000000",
          strokeThickness: 5,
        }).setOrigin(0.5).setDepth(51);

        const winnerText = scene.add.text(640, 300, winnerMsg, {
          fontSize: "72px",
          fill: "#ffff00",
          fontFamily: "Arial",
          stroke: "#000000",
          strokeThickness: 6,
        }).setOrigin(0.5).setDepth(51);

        // 🔄 Botón REINICIAR
        const restartButton = scene.add.rectangle(440, 480, 280, 70, 0x2196F3);
        restartButton.setDepth(51);
        restartButton.setInteractive({ useHandCursor: true });

        const restartText = scene.add.text(440, 480, "Reiniciar Partido", {
          fontSize: "28px",
          fill: "#ffffff",
          fontFamily: "Arial",
        }).setOrigin(0.5).setDepth(52);

        restartButton.on('pointerover', () => {
          restartButton.setFillStyle(0x42A5F5);
        });

        restartButton.on('pointerout', () => {
          restartButton.setFillStyle(0x2196F3);
        });

        restartButton.on("pointerdown", () => {
          game.destroy(true);
          gameRef.current = null;
          window.location.reload();
        });

        // 🏠 Botón VOLVER AL LOBBY
        const homeButton = scene.add.rectangle(840, 480, 280, 70, 0x4CAF50);
        homeButton.setDepth(51);
        homeButton.setInteractive({ useHandCursor: true });

        const homeText = scene.add.text(840, 480, "Volver al Menú", {
          fontSize: "28px",
          fill: "#ffffff",
          fontFamily: "Arial",
        }).setOrigin(0.5).setDepth(52);

        homeButton.on('pointerover', () => {
          homeButton.setFillStyle(0x66BB6A);
        });

        homeButton.on('pointerout', () => {
          homeButton.setFillStyle(0x4CAF50);
        });

        homeButton.on('pointerdown', () => {
          window.location.href = "/Kabegol/Home";
        });


        // 🔁 Auto volver al lobby luego de 10 segundos
        scene.time.delayedCall(10000, () => {
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

    function performKick(player, ball, force = 300) {
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
      const scene = this
      if (!gameStarted || gameOver) return;

      // 🎮 Controles del JUGADOR
      if (keys.a.isDown) {
        player.body.setVelocityX(-250);
      } else if (keys.d.isDown) {
        player.body.setVelocityX(250);
      } else {
        player.body.setVelocityX(0);
      }

      // 👟 Patada jugador (igual que en multi: tecla R, anim + performKick con 700)
      if (Phaser.Input.Keyboard.JustDown(keys.r)) {
        animateKick(boot1, this);
        performKick(player, ball, 700);
      }


      if (keys.w.isDown && player.body.touching.down) {
        player.body.setVelocityY(-450);
      }

      // Actualizar botín
      boot1.x = player.x;
      boot1.y = player.y + 48;

      // ================= IA del CPU (humanoide) =================
      if (time - CPU.lastThink >= CPU.thinkMs) {
        CPU.lastThink = time;

        // 1) Selección de modo: DEFENDER si hay peligro, sino INTERCEPT/CLEAR
        if (isDanger(ball, CPU.goalRightX, CPU.dangerRadius)) {
          cpuState.mode = 'DEFEND';
          // Pararse entre la pelota y el arco, sin meterse dentro del arco
          const shieldX = clamp(ball.x - 60, CPU.defendZoneX, CPU.fieldRight - 30);
          cpuState.targetX = shieldX + cpuState.rndBias;
          cpuState.lockUntil = time + 160; // pequeño "compromiso" a defender
        } else {
          const distToBall = Phaser.Math.Distance.Between(cpu.x, cpu.y, ball.x, ball.y);

          // Si está muy cerca de la pelota, prioriza resolver (CLEAR/SHOOT)
          if (distToBall < CPU.closeBallDist + 12) {
            cpuState.mode = 'CLEAR';
            cpuState.targetX = ball.x + (ball.x > cpu.x ? -4 : 4); // leve ajuste para perfilarse
            cpuState.lockUntil = time + 140;
          } else {
            // INTERCEPT: ir al x donde va a picar; si no vuela, ir directo al balón
            const xPred = (ball.body.velocity.y > -50 || ball.y < cpu.y - 30)
              ? predictLandingX(
                ball,
                scene.physics.world.gravity.y,
                CPU.groundY,
                CPU.fieldLeft,
                CPU.fieldRight
              )
              : ball.x;

            cpuState.mode = 'INTERCEPT';
            cpuState.targetX = clamp(
              xPred + cpuState.rndBias,
              CPU.fieldLeft + 40,
              CPU.fieldRight - 40
            );
          }
        }

        // 2) Decisiones de salto (bloqueo aéreo / cabeceo)
        const nearHoriz = Math.abs(cpu.x - ball.x) < 36;
        const ballAbove = (ball.y < cpu.y - 10);
        const closeForAirBlock = Phaser.Math.Distance.Between(cpu.x, cpu.y, ball.x, ball.y) < CPU.airBlockDist;

        if (
          cpu.body.touching.down &&
          closeForAirBlock &&
          ballAbove &&
          (isDanger(ball, CPU.goalRightX, CPU.dangerRadius) || Math.random() < CPU.headChance)
        ) {
          cpu.body.setVelocityY(-450); // mismo salto que tu player
        }

        // 3) Intento de patada (cuando conviene)
        const closeToShoot = Phaser.Math.Distance.Between(cpu.x, cpu.y, ball.x, ball.y) < CPU.closeBallDist;
        const isBallToLeft = ball.x < cpu.x;

        if (closeToShoot && time >= cpuState.lockUntil) {
          // a) Pelota baja que viene hacia mí
          const lowBall = (ball.y > cpu.y - 8);
          const coming = isBallToLeft ? (ball.body.velocity.x > -20) : (ball.body.velocity.x < 20);

          // b) Alineado horizontalmente
          const aligned = Math.abs(cpu.x - ball.x) < 20;

          if ((lowBall && coming) || aligned) {
            animateKick(bootCPU, scene);
            performKick(cpu, ball, 700); // misma fuerza que el jugador
            cpuState.lockUntil = time + 220; // evita spam
          }
        }
      }

      // 4) Movimiento horizontal hacia targetX con deadzone/histeresis (anti-jitter)
      let target = cpuState.targetX;
      let dx = target - cpu.x;

      const zone =
        (Math.abs(dx) <= CPU.deadzone) ? 0 :
          (Math.abs(dx) <= CPU.deadzone + CPU.hysteresis)
            ? Math.sign(dx) * (CPU.deadzone + CPU.hysteresis)
            : dx;

      if (zone < -CPU.deadzone) {
        cpu.body.setVelocityX(-200);
      } else if (zone > CPU.deadzone) {
        cpu.body.setVelocityX(200);
      } else {
        cpu.body.setVelocityX(0);
      }

      // 5) Ajuste contextual: si hay peligro y la pelota quedó a tu derecha, retrocede a cubrir
      if (isDanger(ball, CPU.goalRightX, CPU.dangerRadius) && ball.x > cpu.x + 18) {
        cpu.body.setVelocityX(200); // volver hacia el arco
      }

      // 6) Actualizar botín del CPU
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