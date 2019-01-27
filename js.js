var context = new AudioContext;
var now = 0;

function Kick(context) {
	this.context = context;
};
Kick.prototype.setup = function() {
	this.osc = this.context.createOscillator();
	this.gain = this.context.createGain();
	this.osc.connect(this.gain);
	this.gain.connect(this.context.destination)
};
Kick.prototype.trigger = function(time) {
	this.setup();
	this.osc.frequency.setValueAtTime(200, time);
	this.gain.gain.setValueAtTime(1, time);
	this.osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
	this.gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
	this.osc.start(time);
	this.osc.stop(time + 0.5);
};
var kick = new Kick(context);

function Snare(context) {
	this.context = context;
};
Snare.prototype.noiseBuffer = function() {
	var bufferSize = this.context.sampleRate;
	var buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
	var output = buffer.getChannelData(0);
	for (var i = 0; i < bufferSize; i++) {
		output[i] = Math.random() * 2 - 1;
	}
	return buffer;
};
Snare.prototype.setup = function() {
	this.noise = this.context.createBufferSource();
	this.noise.buffer = this.noiseBuffer();
	var noiseFilter = this.context.createBiquadFilter();
	noiseFilter.type = 'highpass';
	noiseFilter.frequency.value = 1000;
    this.noise.connect(noiseFilter);
    this.noiseEnvelope = this.context.createGain();
    noiseFilter.connect(this.noiseEnvelope);
    this.noiseEnvelope.connect(this.context.destination);
    this.oscS = this.context.createOscillator();
    this.oscS.type = 'triangle';
    this.oscSEnvelope = this.context.createGain();
    this.oscS.connect(this.oscSEnvelope);
    this.oscSEnvelope.connect(this.context.destination);
};
Snare.prototype.trigger = function(time) {
	this.setup();
	this.noiseEnvelope.gain.setValueAtTime(1, time);
	this.noiseEnvelope.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
	this.noise.start(time)
	this.oscS.frequency.setValueAtTime(100, time);
	this.oscSEnvelope.gain.setValueAtTime(0.7, time);
	this.oscSEnvelope.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
	this.oscS.start(time)
	this.oscS.stop(time + 0.2);
	this.noise.stop(time + 0.2);
};
var snare = new Snare(context)

function Hihat(context){
    this.context = context;
};
Hihat.prototype.setup = function(){
    this.fundamental = 40;
	this.gainH = this.context.createGain();
	this.bandpass = context.createBiquadFilter();
    this.bandpass.type = "bandpass";
    this.bandpass.frequency.value = 10000;
    this.highpass = this.context.createBiquadFilter();
    this.highpass.type = "highpass";
    this.highpass.frequency.value = 7000;
    this.ratios = [2, 3, 4.16, 5.43, 6.79, 8.21];
    this.bandpass.connect(this.highpass);
    this.highpass.connect(this.gainH);
	this.gainH.connect(this.context.destination)
}
Hihat.prototype.trigger = function(time){
    this.setup()
    this.ratios.forEach(function(ratio) {
        this.oscH = this.context.createOscillator();
        this.oscH.type = "square";
        this.oscH.frequency.value = this.fundamental * ratio;
        this.oscH.connect(this.bandpass);
        this.oscH.start(this.context.currentTime);
        this.oscH.stop(this.context.currentTime + 0.05);
    },this);
    this.gainH.gain.setValueAtTime(1, time);
    this.gainH.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
}
var hihat = new Hihat(context);

function playSound(e){
	const sound = document.querySelector(`g[data-key="${e}"]`);
	var paths;
	now = context.currentTime;
	switch(e){
		case "KeyS" : 
			snare.trigger(now);
			paths = sound.querySelectorAll("path.move");
			for(let i=0; i<paths.length; i++){
				paths[i].classList.add('playing-snare')
			}
		break;
		case "KeyD" :
			kick.trigger(now);
			if(sound.classList.contains('playing-kick')){
				sound.classList.remove('playing-kick');
			}
			sound.classList.add('playing-kick');
		break;
		case "KeyF" : 
			hihat.trigger(now)
			paths = sound.querySelectorAll("path.move");
			for(let i=0; i<paths.length; i++){
				paths[i].classList.add('playing-hihat')
			}
		break;
		// default: return;
	}
}
window.addEventListener('keydown', e => playSound(e.code));
window.addEventListener('click',function(e){
	let clicked = e.target;
	var element;
	if (clicked.nodeName=="path"){
		element = clicked.parentNode.dataset.key
	}else if(clicked.nodeName=="g"){
		element = clicked.dataset.key
	}else{
		return;
	}
	playSound(element)
});