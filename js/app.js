import * as THREE from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

import fragment from "./shader/fragment.glsl";
import fragment1 from "./shader/fragment1.glsl";
import vertex from "./shader/vertex.glsl";
import vertex1 from "./shader/vertex1.glsl";
import GUI from 'lil-gui'; 
import gsap from "gsap";

import {DotScreenShader} from './CustomShader';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';


export default class Sketch {
  constructor(options) {
    this.scene = new THREE.Scene();

    this.container = options.dom;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0xeeeeee, 1); 
    this.renderer.physicallyCorrectLights = true;
    this.renderer.outputEncoding = THREE.sRGBEncoding;

    this.container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.001,
      1000
    );

    var frustumSize = 1;
    var aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.OrthographicCamera( frustumSize * aspect / + 3, frustumSize * aspect / 2, frustumSize / 2, frustumSize / - 2, -1000, 1000 );
    this.camera.position.set(0, 0, 1);
    this.time = 0;

    this.isPlaying = true;
    
    this.addObjects();
    this.initPost()
    this.resize();
    this.render();
    this.setupResize();
  }

  settings() {
    let that = this;
    this.settings = {
      progress: 0,
      mRefractionRatio: 1.2,
      mFresnelBias: 0.1,
      mFresnelScale: 4.,
      mFresnelPower: 2.,
    };
    this.gui = new GUI();
    this.gui.add(this.settings, "progress", 0, 1, 0.01);
    this.gui.add(this.settings, "mRefractionRatio", 0, 3, 0.01).onChange(()=>{
      this.mat.uniforms.mRefractionRatio.value = this.settings.mRefractionRatio
    });
    this.gui.add(this.settings, "mFresnelBias", 0, 3, 0.01).onChange(()=>{
      this.mat.uniforms.mFresnelBias.value = this.settings.mFresnelBias
    });
    this.gui.add(this.settings, "mFresnelScale", 0, 3, 0.01).onChange(()=>{
      this.mat.uniforms.mFresnelScale.value = this.settings.mFresnelScale
    });
    this.gui.add(this.settings, "mFresnelPower", 0, 3, 0.01).onChange(()=>{
      this.mat.uniforms.mFresnelPower.value = this.settings.mFresnelPower
    });
  }

  initPost(){
    this.composer = new EffectComposer( this.renderer );
    this.composer.addPass( new RenderPass( this.scene, this.camera ) );

    const effect1 = new ShaderPass( DotScreenShader );
    effect1.uniforms[ 'scale' ].value = 400;
    this.composer.addPass( effect1 );
  }

  setupResize() {
    window.addEventListener("resize", this.resize.bind(this));
  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);
    this.composer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    

    // image cover
    this.imageAspect = 853/1280;
    let a1; let a2;
    if(this.height/this.width>this.imageAspect) {
      a1 = (this.width/this.height) * this.imageAspect ;
      a2 = 1;
    } else{
      a1 = 1;
      a2 = (this.height/this.width) / this.imageAspect;
    }

    this.camera.updateProjectionMatrix();


  }

  addObjects() {

    this.cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256,{
        format: THREE.RGBAFormat,
        generateMipmaps: true,
        minFilter: THREE.LinearMipMapLinearFilter,
        encoding: THREE.sRGBEncoding
      }
    )

    this.cubeCamera = new THREE.CubeCamera(0.1,10,this.cubeRenderTarget)

    let that = this;
    this.material = new THREE.ShaderMaterial({
      extensions: {
        derivatives: "#extension GL_OES_standard_derivatives : enable"
      },
      side: THREE.DoubleSide,
      uniforms: {
        time: { value: 0 },
        resolution: { value: new THREE.Vector4() },
      },
      // wireframe: true,
      // transparent: true,
      vertexShader: vertex,
      fragmentShader: fragment
    });

    this.geometry = new THREE.SphereBufferGeometry(1.5, 38, 32);

    this.plane = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.plane);




    let geo = new THREE.SphereBufferGeometry(0.4,32,32);
    this.mat = new THREE.ShaderMaterial({
      extensions: {
        derivatives: "#extension GL_OES_standard_derivatives : enable"
      },
      side: THREE.DoubleSide,
      uniforms: {
        time: { value: 0 },
        tCube: { value: 0 },
        mRefractionRatio: {value: 1.02},
        mFresnelBias: {value: 0.1},
        mFresnelScale: {value: 4.},
        mFresnelPower: {value: 2.},
        resolution: { value: new THREE.Vector4() },
      },
      // wireframe: true,
      // transparent: true,
      fragmentShader: fragment1
    });

    this.smallSphere = new THREE.Mesh(geo,this.mat)
    this.scene.add(this.smallSphere)
  }

  stop() {
    this.isPlaying = false;
  }

  play() {
    if(!this.isPlaying){
      this.isPlaying = true;
      this.render()
    }
  }

  render() {
    if (!this.isPlaying) return;
    this.time += 0.010;
    this.smallSphere.visible = false;
    this.cubeCamera.update(this.renderer,this.scene);
    this.smallSphere.visible = true;
    this.mat.uniforms.tCube.value = this.cubeRenderTarget.texture
    this.material.uniforms.time.value = this.time;
    requestAnimationFrame(this.render.bind(this));
    // this.renderer.render(this.scene, this.camera);
    this.composer.render(this.scene, this.camera);
  }
}

new Sketch({
  dom: document.getElementById("container")
});


/* LENIS DARK	vec3 baseFirst = vec3(79./255., 38./255., 233./255.);
	vec3 accent =  vec3(0./255., 0./255., 0./255.);
	vec3 baseSecond =  vec3(183./255., 76./255., 105./255.);
	vec3 baseThird =  vec3(79./255., 38./255., 233./255.);*/

  /* LEMNIS LIGHT	vec3 baseFirst = vec3(79./255., 38./255., 233./255.);
	vec3 accent =  vec3(0./255., 0./255., 0./255.);
	vec3 baseSecond =  vec3(255./255., 152./255., 162./255.);
	vec3 baseThird =  vec3(79./255., 38./255., 233./255.);*/

  /* RED MONOPO 	vec3 baseFirst = vec3(79./255., 38./255., 233./255.);
	vec3 accent =  vec3(0./255., 0./255., 0./255.);
	vec3 baseSecond =  vec3(188./255., 22./255., 42./255.);
	vec3 baseThird =  vec3(79./255., 38./255., 233./255.);*/

  /* ORANGE MONOPO 	vec3 baseFirst = vec3(238./255., 127./255., 39./255.);
	vec3 accent =  vec3(0./255., 0./255., 0./255.);
	vec3 baseSecond =  vec3(188./255., 22./255., 42./255.);
	vec3 baseThird = vec3(238./255., 127./255., 39./255.);*/