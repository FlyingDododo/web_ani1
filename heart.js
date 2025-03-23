/**
 * 心形类 - 创建3D心形和脉动效果
 */
class Heart {
  constructor(x, y, z, size, color) {
    this.pos = createVector(x, y, z);
    this.baseSize = size;
    this.size = size;
    this.targetSize = size;
    this.color = color;
    this.rotation = 0;
    this.pulseSpeed = random(0.02, 0.04);
    this.pulseAmount = 0.15;
    this.rotationSpeed = 0.005;
    this.time = random(100);
    this.pulseIntensity = 1; // 可通过UI控制
  }
  
  // 设置心跳强度
  setPulseIntensity(intensity) {
    this.pulseIntensity = intensity;
  }

  // 根据低频值跳动
  pulse(bassValue) {
    // 设置目标大小，根据低频值调整
    this.targetSize = this.baseSize * (1 + bassValue * 0.5 * this.pulseIntensity);
    
    // 平滑过渡到目标大小
    this.size = lerp(this.size, this.targetSize, 0.1);
    
    // 随时间自然脉动
    this.time += this.pulseSpeed;
    let naturalPulse = sin(this.time) * this.pulseAmount * this.pulseIntensity;
    this.size += naturalPulse;
    
    // 根据低频值调整旋转速度
    this.rotation += this.rotationSpeed * (1 + bassValue * 0.5);
  }
  
  // 绘制3D心形
  display() {
    push();
    translate(this.pos.x, this.pos.y, this.pos.z);
    rotateY(this.rotation);
    rotateX(this.rotation * 0.7);
    
    // 设置颜色和材质
    fill(this.color);
    specularMaterial(this.color);
    shininess(20);
    noStroke();
    
    // 绘制心形
    this.drawHeart(this.size);
    
    pop();
  }
  
  // 绘制3D心形
  drawHeart(size) {
    // 心形参数化公式
    beginShape();
    for (let theta = 0; theta < TWO_PI; theta += 0.01) {
      let r = 2 - 2 * sin(theta) + sin(theta) * sqrt(abs(cos(theta))) / (sin(theta) + 1.4);
      let x = r * cos(theta) * size;
      let y = -r * sin(theta) * size;
      let z = 0;
      
      // 添加3D效果
      let depth = (1 - cos(theta * 2)) * size * 0.3;
      vertex(x, y, depth);
    }
    endShape(CLOSE);
    
    // 绘制背面以增强3D感
    beginShape();
    for (let theta = 0; theta < TWO_PI; theta += 0.01) {
      let r = 2 - 2 * sin(theta) + sin(theta) * sqrt(abs(cos(theta))) / (sin(theta) + 1.4);
      let x = r * cos(theta) * size;
      let y = -r * sin(theta) * size;
      let z = 0;
      
      // 背面深度
      let depth = -(1 - cos(theta * 2)) * size * 0.3;
      vertex(x, y, depth);
    }
    endShape(CLOSE);
    
    // 连接前后表面边缘
    beginShape(TRIANGLE_STRIP);
    for (let theta = 0; theta < TWO_PI + 0.1; theta += 0.1) {
      let r = 2 - 2 * sin(theta) + sin(theta) * sqrt(abs(cos(theta))) / (sin(theta) + 1.4);
      let x = r * cos(theta) * size;
      let y = -r * sin(theta) * size;
      
      let frontDepth = (1 - cos(theta * 2)) * size * 0.3;
      let backDepth = -(1 - cos(theta * 2)) * size * 0.3;
      
      vertex(x, y, frontDepth);
      vertex(x, y, backDepth);
    }
    endShape(CLOSE);
  }
}

/**
 * 心形连接线类 - 连接两个心形
 */
class HeartConnection {
  constructor(heart1, heart2) {
    this.heart1 = heart1;
    this.heart2 = heart2;
    this.particles = [];
    this.maxParticles = 50;
    
    // 初始化连接粒子
    for (let i = 0; i < this.maxParticles; i++) {
      this.addParticle();
    }
  }
  
  // 添加连接粒子
  addParticle() {
    let t = random();
    let pos = p5.Vector.lerp(this.heart1.pos, this.heart2.pos, t);
    
    // 让粒子在连线附近随机分布
    pos.x += random(-30, 30);
    pos.y += random(-30, 30);
    pos.z += random(-10, 10);
    
    let particle = {
      pos: pos,
      t: t,
      speed: random(0.001, 0.005),
      size: random(2, 5),
      life: 255
    };
    
    this.particles.push(particle);
  }
  
  // 更新连接线
  update(bassValue) {
    // 更新现有粒子
    for (let i = this.particles.length - 1; i >= 0; i--) {
      let p = this.particles[i];
      
      // 移动粒子
      p.t += p.speed * (1 + bassValue);
      if (p.t > 1) p.t = 0;
      
      // 更新位置，沿着两颗心之间的连线移动
      p.pos = p5.Vector.lerp(this.heart1.pos, this.heart2.pos, p.t);
      
      // 添加偏移使粒子看起来更自然
      p.pos.x += sin(frameCount * 0.05 + i) * 10;
      p.pos.y += cos(frameCount * 0.03 + i) * 8;
      
      // 降低生命值
      p.life -= 0.5;
      
      // 移除死亡粒子
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        this.addParticle();
      }
    }
    
    // 根据低频值添加新粒子
    if (random() < 0.1 + bassValue * 0.2) {
      if (this.particles.length < this.maxParticles) {
        this.addParticle();
      }
    }
  }
  
  // 显示连接线和粒子
  display() {
    // 绘制心形之间的连接线
    stroke(200, 100);
    strokeWeight(1);
    line(this.heart1.pos.x, this.heart1.pos.y, this.heart1.pos.z,
         this.heart2.pos.x, this.heart2.pos.y, this.heart2.pos.z);
    
    // 绘制连接粒子
    noStroke();
    for (let p of this.particles) {
      push();
      translate(p.pos.x, p.pos.y, p.pos.z);
      
      // 计算颜色——从第一个心到第二个心的渐变
      let heartColor1 = color(this.heart1.color);
      let heartColor2 = color(this.heart2.color);
      let particleColor = lerpColor(heartColor1, heartColor2, p.t);
      
      // 设置透明度
      particleColor.setAlpha(p.life);
      fill(particleColor);
      
      // 绘制粒子
      ellipse(0, 0, p.size, p.size);
      pop();
    }
  }
} 