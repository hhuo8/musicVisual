function $(s) {
	return document.querySelectorAll(s);
}

function MusicDraw(obj) {
	this.source = null;
	this.analyser = MusicDraw.ac.createAnalyser();
	this.size = obj.size;
	this.analyser.fftSize = this.size * 2;
	this.gainNode = MusicDraw.ac.createGain();
    this.gainNode.connect(MusicDraw.ac.destination);
    this.analyser.connect(this.gainNode);
    this.xhr = new XMLHttpRequest();
    this.draw = obj.draw;
    this.init();
}
MusicDraw.ac = new (window.AudioContext||window.webkitAudioContext)();

MusicDraw.prototype = {
    constructor:MusicDraw,
    load:function(url,func){
        this.xhr.abort();
        this.xhr.open("GET",url);
        this.xhr.responseType = "arraybuffer";
        var self = this;
        this.xhr.onload = function() {
            func(self.xhr.response);
        }
        this.xhr.send();
    },
    decode:function(arraybuffer,func){
        MusicDraw.ac.decodeAudioData(arraybuffer,function(buffer) {
            func(buffer);
        },function(err) {
            console.log(err);
        });
    },
    play:function(path,timeLine,timeShow){
		var self = this;
		if(this.source){
			this.source.stop(0);
		}
		this.load(path,function(arraybuffer) {
			self.decode(arraybuffer, function(buffer) {
				var bufferSource = MusicDraw.ac.createBufferSource();
				bufferSource.connect(self.analyser);
				bufferSource.buffer = buffer;
				bufferSource.start(0);

				self.source = bufferSource;
			});
		});
    },
    changeVolume:function(percent){
        this.gainNode.gain.value = percent;
    },
    init:function(){
        var arr = new Uint8Array(this.analyser.frequencyBinCount);
        requestAnimationFrame = window.requestAnimationFrame|| 
                                window.webkitRequestAnimationFrame;
        var self = this;
        function v() {
            self.analyser.getByteFrequencyData(arr);
            self.draw(arr);
            requestAnimationFrame(v);
        }
        requestAnimationFrame(v);
	},
}

var size = 128;
var box = $("#box")[0];
var height,width;
var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");
var Dots = [];
var line;
var mv = new MusicDraw({
	size:size,
	draw:draw
});

box.appendChild(canvas);
resize();
window.onresize=resize;

function random(m,n) {  //返回m到n之间的整数
	return Math.round(Math.random()*(n - m) + m);
}
function resize() {
	height = box.clientHeight;
	width = box.clientWidth;
	canvas.height = height;
	canvas.width = width;

	line = ctx.createLinearGradient(0,0,0,height);
	line.addColorStop(0,"#CD0000");
	line.addColorStop(0.5,"#FFC125");
	line.addColorStop(1,"#9F35FF");

	Dots = [];
    for(var i = 0; i < size; i++){
    	Dots.push({
       		cap:0
    	});
    }
}

function draw(arr) {
	ctx.clearRect(0, 0, width, height);
	var aWidth = width / size;  //size == arr.length
	var cubeWidth = aWidth * 0.8;
	var dotHigh = cubeWidth > 10 ? 10 : cubeWidth;//small cube high
	ctx.fillStyle = line;
	for(var i = 0; i < size; i++){
		var Dot = Dots[i];
		var h = arr[i] / 256 * height;
		ctx.fillRect(aWidth * i, height - h, cubeWidth, h);//(x,y,width,height)
		ctx.fillRect(aWidth * i, height - (Dot.cap+dotHigh), cubeWidth, dotHigh);
		Dot.cap--;
		if(Dot.cap < 0){
			Dot.cap = 0;
		}
		if(h > 0 && Dot.cap < h + 40){
			Dot.cap = h + 40 >  height - dotHigh ?height - dotHigh : h + 40;//cap is the position of cube
		}
	}
}

$("#volume")[0].onchange = function() {
	mv.changeVolume(this.value/this.max);
}

function run(files){
    var blob = window.URL.createObjectURL(files[0]),
    	fileName = files[0].name;

		$("#locale-file")[0].innerHTML = "<li class='selected' title="+fileName+">"+fileName+"</li>";
    mv.play(blob,"#alltime","#time");
}

