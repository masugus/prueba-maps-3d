// Copyright 2021 Google LLC

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Loader } from "@googlemaps/js-api-loader";

let object3D;
let initialY;

const apiOptions = {
  apiKey: "AIzaSyAZvkib9sIEUigQtxjxwgT-JZMwnSMo2Dc",
  version: "beta",
};

const mapOptions = {
  tilt: 0,
  heading: 0,
  zoom: 18,
  center: { lat: 38.92559164453886, lng: -3.1886610473072463 },
  mapId: "4d8340f571ce1f9e",
};

async function initMap() {
  const mapDiv = document.getElementById("map");
  const apiLoader = new Loader(apiOptions);
  await apiLoader.load();
  return new google.maps.Map(mapDiv, mapOptions);
}

function initWebGLOverlayView(map) {
  let scene, renderer, camera, loader;
  const webGLOverlayView = new google.maps.WebGLOverlayView();

  webGLOverlayView.onAdd = () => {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera();
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75); // soft white light
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.25);
    directionalLight.position.set(0.5, -1, 0.5);
    // Mueve la cámara hacia atrás para que podamos ver la escena
    camera.position.z = 5;
    scene.add(directionalLight);

    loader = new GLTFLoader();
    const source = "pin.gltf";
    const source1 = "scene.gltf";
    const source2 = "simple_heart_ring/scene.gltf";

    loader.load(
      source2,
      (gltf) => {
        gltf.scene.scale.set(1, 1, 1);
        gltf.scene.rotation.x = (90 * Math.PI) / 180;
        gltf.scene.translateY(-25);
        gltf.scene.translateX(5);
        gltf.scene.translateZ(15);

        scene.add(gltf.scene);
        // Guarda la referencia al objeto 3D para usarla en la animación
        object3D = gltf.scene;
        animate();
      },
      undefined,
      (error) => console.error(error)
    );
  };

  // Función de animación
  function animate() {
    requestAnimationFrame(animate);
    // Si el objeto 3D está definido, rota un poco en cada frame
    if (object3D) {
      object3D.rotation.y += 0.01;
     
    // Guarda la posición inicial en Y del objeto
    if (initialY === undefined) {
      initialY = object3D.position.z;
    }

    // Añade un movimiento vertical que simula el efecto de saltar en una cama elástica
    object3D.position.z = initialY - Math.abs(Math.sin(Date.now() / 500) * 75);

    }
    // renderer.render(scene, camera);
  }


  webGLOverlayView.onContextRestored = ({ gl }) => {
    renderer = new THREE.WebGLRenderer({
      canvas: gl.canvas,
      context: gl,
      ...gl.getContextAttributes(),
    });

    renderer.autoClear = false;

    loader.manager.onLoad = () => {
      renderer.setAnimationLoop(() => {
        map.moveCamera({
          tilt: mapOptions.tilt,
          heading: mapOptions.heading,
          zoom: mapOptions.zoom,
        });

        if (mapOptions.tilt < 67.5) {
          mapOptions.tilt += 0.5;
        } else if (mapOptions.heading <= 360) {
          mapOptions.heading += 0.2;
        } else {
          renderer.setAnimationLoop(null);
        }
      });
    };
  };

  webGLOverlayView.onDraw = ({ gl, transformer }) => {
    const latLngAltitudeLiteral = {
      lat: mapOptions.center.lat,
      lng: mapOptions.center.lng,
      altitude: 120,
    };

    const matrix = transformer.fromLatLngAltitude(latLngAltitudeLiteral);
    camera.projectionMatrix = new THREE.Matrix4().fromArray(matrix);

    webGLOverlayView.requestRedraw();
    renderer.render(scene, camera);
    renderer.resetState();
  };
  webGLOverlayView.setMap(map);
}

(async () => {
  const map = await initMap();
  initWebGLOverlayView(map);
})();
