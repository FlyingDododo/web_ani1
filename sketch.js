// 全局变量
let sound;               // 当前播放的音乐
let fft;                 // 频谱分析对象
let amplitude;           // 振幅分析对象
let leftParticles;       // 左侧粒子系统
let rightParticles;      // 右侧粒子系统
let songs = [];          // 歌曲列表
let songNames = [        // 歌曲名称列表
  'Same',
  'No Emotion'
];
let songFiles = [        // 歌曲文件路径
  'Same.mp3',
  'NoEmotion.mp3'  // 修改为无空格文件名
];
let isPlaying = false;   // 播放状态
let panSlider;           // 声道平衡滑块
let volumeSlider;        // 音量滑块
let playButton;          // 播放按钮
let pauseButton;         // 暂停按钮
let stopButton;          // 停止按钮
let songSelect;          // 歌曲选择下拉菜单
let currentSongIndex = -1;  // 当前播放歌曲索引

// 预加载音乐文件
function preload() {
  // 创建音乐文件数组
  for (let i = 0; i < songFiles.length; i++) {
    // 编码文件名以处理空格和特殊字符
    let encodedFileName = encodeURIComponent(songFiles[i]);
    
    // 添加错误处理
    let song = loadSound(encodedFileName, 
      // 成功回调
      () => {
        console.log(`成功加载: ${songNames[i]}`);
      }, 
      // 错误回调
      (err) => {
        console.error(`加载音乐文件失败: ${songNames[i]}`, err);
        alert(`无法加载音乐: ${songNames[i]}`);
      }
    );
    songs.push(song);
  }
}

// 初始化设置
function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100, 255);
  
  // 初始化音频分析工具
  fft = new p5.FFT();
  amplitude = new p5.Amplitude();
  
  // 初始化粒子系统
  leftParticles = new ParticleSystem(50, true);   // 左侧粒子系统
  rightParticles = new ParticleSystem(50, false); // 右侧粒子系统
  
  // 获取HTML元素
  playButton = select('#playButton');
  pauseButton = select('#pauseButton');
  stopButton = select('#stopButton');
  songSelect = select('#songSelect');
  volumeSlider = select('#volumeSlider');
  panSlider = select('#panSlider');
  
  // 添加歌曲选项到下拉菜单
  for (let i = 0; i < songNames.length; i++) {
    songSelect.option(songNames[i], i);
  }
  
  // 设置事件监听器
  playButton.mousePressed(playSelectedSong);
  pauseButton.mousePressed(pauseSong);
  stopButton.mousePressed(stopSong);
  songSelect.changed(songSelected);
  volumeSlider.input(setVolume);
  panSlider.input(setPan);
  
  // 初始化音量和平衡
  setVolume();
  setPan();
}

// 绘制循环
function draw() {
  background(0, 0, 0, 30);
  
  // 如果没有音乐在播放，显示初始界面
  if (!isPlaying || !sound) {
    displayIntro();
    return;
  }
  
  // 分析音频
  let spectrum = fft.analyze();
  let level = amplitude.getLevel();
  
  // 获取低频、中频和高频能量
  let bass = fft.getEnergy("bass");
  let mid = fft.getEnergy("mid");
  let treble = fft.getEnergy("treble");
  
  // 将频率能量映射到0-1范围
  let bassNorm = map(bass, 0, 255, 0, 1);
  let midNorm = map(mid, 0, 255, 0, 1);
  let trebleNorm = map(treble, 0, 255, 0, 1);
  
  // 计算频率比例值（低频到高频）
  let freqRatio = (bassNorm * 0.2 + midNorm * 0.3 + trebleNorm * 0.5);
  
  // 绘制中间分隔线
  stroke(200, 30);
  strokeWeight(2);
  line(width/2, 0, width/2, height);
  noStroke();
  
  // 更新和显示粒子系统
  leftParticles.adjustParticles(level, 200);
  rightParticles.adjustParticles(level, 200);
  
  leftParticles.run(freqRatio, level);
  rightParticles.run(freqRatio, level);
  
  // 显示波形
  drawWaveform();
  
  // 显示播放信息
  displayInfo(level, bass, mid, treble);
}

// 显示波形
function drawWaveform() {
  let waveform = fft.waveform();
  
  stroke(200, 50);
  strokeWeight(2);
  noFill();
  
  // 左声道波形
  beginShape();
  for (let i = 0; i < waveform.length; i += 20) {
    let x = map(i, 0, waveform.length, 0, width/2);
    let y = map(waveform[i], -1, 1, height/4, height*3/4);
    vertex(x, y);
  }
  endShape();
  
  // 右声道波形
  beginShape();
  for (let i = 0; i < waveform.length; i += 20) {
    let x = map(i, 0, waveform.length, width/2, width);
    let y = map(waveform[i], -1, 1, height/4, height*3/4);
    vertex(x, y);
  }
  endShape();
}

// 显示介绍信息
function displayIntro() {
  textAlign(CENTER, CENTER);
  fill(200);
  textSize(32);
  text("Together Apart", width/2, height/2 - 50);
  textSize(18);
  text("异地情侣音乐播放器", width/2, height/2);
  textSize(14);
  text("请从下方选择一首歌曲开始播放", width/2, height/2 + 50);
}

// 显示播放信息
function displayInfo(level, bass, mid, treble) {
  textAlign(LEFT, TOP);
  fill(200);
  textSize(14);
  
  // 左侧显示当前播放歌曲
  if (currentSongIndex >= 0) {
    text("正在播放: " + songNames[currentSongIndex], 20, 20);
  }
  
  // 右侧显示音频信息
  textAlign(RIGHT, TOP);
  text("音量: " + nf(level, 0, 2), width - 20, 20);
  text("低频: " + int(bass), width - 20, 40);
  text("中频: " + int(mid), width - 20, 60);
  text("高频: " + int(treble), width - 20, 80);
}

// 播放选中的歌曲
function playSelectedSong() {
  if (currentSongIndex < 0) {
    alert("请先选择一首歌曲");
    return;
  }
  
  // 如果已经有歌曲在播放，先停止
  if (sound && sound.isPlaying()) {
    sound.stop();
  }
  
  // 播放新选择的歌曲
  sound = songs[currentSongIndex];
  
  // 让fft和振幅分析器使用当前音乐作为输入源
  fft.setInput(sound);
  amplitude.setInput(sound);
  
  // 设置初始音量
  sound.setVolume(volumeSlider.value());
  
  // 播放音乐
  sound.play();
  isPlaying = true;
}

// 暂停当前歌曲
function pauseSong() {
  if (sound && sound.isPlaying()) {
    sound.pause();
    isPlaying = false;
  } else if (sound) {
    sound.play();
    isPlaying = true;
  }
}

// 停止当前歌曲
function stopSong() {
  if (sound) {
    sound.stop();
    isPlaying = false;
  }
}

// 歌曲选择事件
function songSelected() {
  let index = songSelect.value();
  if (index !== '') {
    currentSongIndex = parseInt(index);
    
    // 停止当前播放的歌曲
    if (sound && sound.isPlaying()) {
      sound.stop();
      isPlaying = false;
    }
    
    // 自动播放新选择的歌曲
    sound = songs[currentSongIndex];
    
    // 让fft和振幅分析器使用当前音乐作为输入源
    fft.setInput(sound);
    amplitude.setInput(sound);
    
    // 设置初始音量
    sound.setVolume(volumeSlider.value());
    
    // 播放音乐
    sound.play();
    isPlaying = true;
  }
}

// 设置音量
function setVolume() {
  let volume = volumeSlider.value();
  if (sound) {
    sound.setVolume(volume);
  }
}

// 设置声道平衡
function setPan() {
  // 只有当歌曲在播放时才能设置声道平衡
  if (sound) {
    let panValue = panSlider.value();
    sound.pan(panValue);
  }
}

// 窗口大小调整
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
} 