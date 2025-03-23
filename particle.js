/**
 * 粒子类 - 用于创建视觉效果
 */
class Particle {
  constructor(x, y, hue, isLeftSide) {
    this.pos = createVector(x, y);
    this.vel = createVector(random(-1, 1), random(-1, 1));
    this.acc = createVector(0, 0);
    this.size = random(3, 8);
    this.maxSpeed = 4;
    this.hue = hue;
    this.alpha = 200;
    this.isLeftSide = isLeftSide; // 标记粒子属于左侧还是右侧
  }

  // 施加力到粒子
  applyForce(force) {
    this.acc.add(force);
  }

  // 边界检查，确保粒子保持在画布内
  checkEdges(width, height) {
    if (this.pos.x > width || this.pos.x < 0) {
      this.vel.x *= -0.8;
    }
    if (this.pos.y > height || this.pos.y < 0) {
      this.vel.y *= -0.8;
    }
  }

  // 根据频率设置吸引或排斥
  setAttraction(centerX, energy, frequencyValue) {
    // 创建一个指向中心的向量
    let center = createVector(centerX, height / 2);
    let dir = p5.Vector.sub(center, this.pos);
    
    // 归一化向量
    dir.normalize();
    
    // 根据频率值调整力的方向和大小
    if (frequencyValue > 0.5) {
      // 高频时向外散开
      dir.mult(-1 * energy * 0.2);
    } else {
      // 低频时向中心聚集
      dir.mult(energy * 0.1);
    }
    
    this.applyForce(dir);
  }

  // 更新粒子状态
  update(volumeLevel) {
    // 音量影响速度
    this.maxSpeed = map(volumeLevel, 0, 1, 1, 6);
    
    // 更新速度和位置
    this.vel.add(this.acc);
    this.vel.limit(this.maxSpeed);
    this.pos.add(this.vel);
    this.acc.mult(0);
    
    // 添加一些随机性
    this.vel.add(createVector(random(-0.1, 0.1), random(-0.1, 0.1)));
  }

  // 渲染粒子
  display() {
    noStroke();
    
    // 根据粒子所在的一侧设置颜色
    if (this.isLeftSide) {
      fill(this.hue, 80, 100, this.alpha);
    } else {
      fill(this.hue + 180, 80, 100, this.alpha);
    }
    
    ellipse(this.pos.x, this.pos.y, this.size, this.size);
  }
}

/**
 * 粒子系统类 - 管理所有粒子
 */
class ParticleSystem {
  constructor(numParticles, isLeftSide) {
    this.particles = [];
    this.isLeftSide = isLeftSide;
    this.hue = isLeftSide ? 170 : 350; // 左侧蓝绿色系，右侧红紫色系
    
    // 初始化粒子
    for (let i = 0; i < numParticles; i++) {
      let x, y;
      
      if (isLeftSide) {
        x = random(0, width / 2);
      } else {
        x = random(width / 2, width);
      }
      
      y = random(0, height);
      this.particles.push(new Particle(x, y, this.hue, isLeftSide));
    }
  }

  // 根据音频数据更新并显示所有粒子
  run(frequencyValue, volumeLevel) {
    for (let particle of this.particles) {
      // 计算吸引力中心
      let centerX = this.isLeftSide ? width * 0.25 : width * 0.75;
      
      // 应用吸引/排斥力
      particle.setAttraction(centerX, volumeLevel * 2, frequencyValue);
      
      // 更新粒子状态
      particle.update(volumeLevel);
      
      // 边界检查
      particle.checkEdges(width, height);
      
      // 显示粒子
      particle.display();
    }
  }

  // 添加新粒子
  addParticle() {
    let x, y;
    
    if (this.isLeftSide) {
      x = random(0, width / 2);
    } else {
      x = random(width / 2, width);
    }
    
    y = random(0, height);
    this.particles.push(new Particle(x, y, this.hue, this.isLeftSide));
  }

  // 根据音量调整粒子数量
  adjustParticles(volumeLevel, maxParticles) {
    // 目标粒子数量基于音量
    let targetCount = floor(map(volumeLevel, 0, 1, 20, maxParticles));
    
    // 当前粒子数量
    let currentCount = this.particles.length;
    
    // 如果需要增加粒子
    if (currentCount < targetCount) {
      for (let i = 0; i < 2; i++) {
        if (this.particles.length < maxParticles) {
          this.addParticle();
        }
      }
    } 
    // 如果需要减少粒子
    else if (currentCount > targetCount && random() > 0.95) {
      this.particles.splice(0, 1);
    }
  }
} 