import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CityCoinData } from '../services/cityGeckoService';

export type CameraMode = 'street' | 'flyover';

interface CityVisualizer3DProps {
  coins: CityCoinData[];
  selectedCoin: CityCoinData | null;
  onSelectCoin: (coin: CityCoinData) => void;
  cameraMode: CameraMode;
  districtFilter: string;
  focusedCoinId?: string | null;
}

export const CityVisualizer3D: React.FC<CityVisualizer3DProps> = ({
  coins,
  selectedCoin,
  onSelectCoin,
  cameraMode,
  districtFilter,
  focusedCoinId
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Keyboard input tracking for Street Walk mode
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const cameraYaw = useRef<number>(0);
  const cameraPitch = useRef<number>(0);
  const isMouseDown = useRef<boolean>(false);
  const lastMousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Street camera position state ref
  const streetPos = useRef<THREE.Vector3>(new THREE.Vector3(0, 3.5, 30));

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas || coins.length === 0) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#030712'); // Dark cyber midnight bg
    scene.fog = new THREE.FogExp2('#030712', 0.0035);

    // 2. Camera Setup
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.5, 1000);

    if (cameraMode === 'flyover') {
      camera.position.set(0, 160, 240);
    } else {
      camera.position.copy(streetPos.current);
    }

    // 3. Renderer Setup
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = false; // Disabled for performance with 300+ skyscrapers

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight('#1e293b', 1.8);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight('#38bdf8', 1.2); // Sky blue
    dirLight1.position.set(100, 200, 100);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight('#a855f7', 0.8); // Cyber purple
    dirLight2.position.set(-100, 150, -100);
    scene.add(dirLight2);

    // 5. Controls setup
    let orbitControls: OrbitControls | null = null;
    if (cameraMode === 'flyover') {
      orbitControls = new OrbitControls(camera, renderer.domElement);
      orbitControls.enableDamping = true;
      orbitControls.dampingFactor = 0.05;
      orbitControls.maxPolarAngle = Math.PI / 2.05; // Stay above ground level
      orbitControls.maxDistance = 600;
      orbitControls.minDistance = 20;
      orbitControls.target.set(0, 20, 0);
    }

    // 6. City Layout Construction (Grid of blocks separated by streets)
    const BLOCK_SIZE = 28; // Size of each building plot block
    const ROAD_WIDTH = 14;  // Width of streets/avenues
    const SPACING = BLOCK_SIZE + ROAD_WIDTH;
    const BLOCKS_PER_ROW = 16; // Grid 16x16 = 256 plots

    // Ground Plane with Cyber Grid
    const cityAreaSize = BLOCKS_PER_ROW * SPACING + 100;
    const gridHelper = new THREE.GridHelper(cityAreaSize, BLOCKS_PER_ROW * 2, '#334155', '#0f172a');
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);

    // Dark asphalt ground plane
    const groundGeo = new THREE.PlaneGeometry(cityAreaSize * 1.5, cityAreaSize * 1.5);
    const groundMat = new THREE.MeshStandardMaterial({
      color: '#020617',
      roughness: 0.8,
      metalness: 0.2
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    scene.add(groundMesh);

    // Canvas texture generator for skyscraper window grid
    const createWindowTexture = (baseHexColor: string) => {
      const texCanvas = document.createElement('canvas');
      texCanvas.width = 128;
      texCanvas.height = 256;
      const ctx = texCanvas.getContext('2d');
      if (!ctx) return null;

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 128, 256);

      // Draw lit window grid matching building color
      ctx.fillStyle = baseHexColor;
      for (let y = 8; y < 256; y += 16) {
        for (let x = 8; x < 128; x += 16) {
          if (Math.random() > 0.25) { // 75% lit windows
            ctx.fillRect(x, y, 10, 10);
          }
        }
      }

      const texture = new THREE.CanvasTexture(texCanvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      return texture;
    };

    // Label texture generator for 3D Rooftop Billboards
    const createBillboardTexture = (symbol: string, rank: number, change: number, name: string) => {
      const texCanvas = document.createElement('canvas');
      texCanvas.width = 256;
      texCanvas.height = 128;
      const ctx = texCanvas.getContext('2d');
      if (!ctx) return null;

      ctx.clearRect(0, 0, 256, 128);

      // Background rounded pill
      ctx.fillStyle = 'rgba(3, 7, 18, 0.9)';
      ctx.strokeStyle = change >= 0 ? '#22c55e' : '#ef4444';
      ctx.lineWidth = 3;

      ctx.beginPath();
      ctx.roundRect(10, 10, 236, 108, 16);
      ctx.fill();
      ctx.stroke();

      // Rank badge
      ctx.fillStyle = change >= 0 ? '#15803d' : '#b91c1c';
      ctx.beginPath();
      ctx.roundRect(20, 20, 60, 28, 8);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`#${rank}`, 50, 40);

      // Symbol
      ctx.font = 'bold 26px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(symbol, 90, 42);

      // Name / Change %
      ctx.font = '600 18px sans-serif';
      ctx.fillStyle = change >= 0 ? '#4ade80' : '#f87171';
      ctx.fillText(`${change >= 0 ? '+' : ''}${change.toFixed(2)}%`, 20, 95);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '500 15px sans-serif';
      ctx.textAlign = 'right';
      const truncatedName = name.length > 12 ? name.substring(0, 10) + '..' : name;
      ctx.fillText(truncatedName, 230, 95);

      const texture = new THREE.CanvasTexture(texCanvas);
      texture.minFilter = THREE.LinearFilter;
      return texture;
    };

    // Shared box geometry template (scaled per building)
    const baseBoxGeo = new THREE.BoxGeometry(1, 1, 1);

    interface BuildingObject {
      group: THREE.Group;
      mesh: THREE.Mesh;
      beaconMesh: THREE.Mesh;
      sprite: THREE.Sprite | null;
      coin: CityCoinData;
      position: THREE.Vector3;
      height: number;
    }

    const buildingObjects: BuildingObject[] = [];
    const coinIdToBuilding = new Map<string, BuildingObject>();

    // 7. Render Skyscrapers across City Blocks
    coins.forEach((coin, idx) => {
      // Determine Grid Row & Col (Spiral out from center for rank ordering)
      let ring = 0;
      let countInRing = 1;
      let currIndex = idx;

      while (currIndex >= countInRing) {
        currIndex -= countInRing;
        ring++;
        countInRing = ring * 8;
      }

      const angle = (currIndex / countInRing) * Math.PI * 2;
      const radius = ring * SPACING;

      const posX = Math.cos(angle) * radius;
      const posZ = Math.sin(angle) * radius;

      const isFilteredOut = districtFilter !== 'All' && coin.district !== districtFilter;

      const bGroup = new THREE.Group();
      bGroup.position.set(posX, coin.height / 2, posZ);

      // Building Dimensions
      const baseWidth = Math.max(8, 18 - Math.min(10, coin.market_cap_rank * 0.05));
      const baseDepth = baseWidth;

      const windowTex = createWindowTexture(coin.color);
      if (windowTex) {
        windowTex.repeat.set(2, Math.max(1, Math.floor(coin.height / 8)));
      }

      const isSelected = selectedCoin?.id === coin.id;

      const mat = new THREE.MeshStandardMaterial({
        color: coin.color,
        roughness: 0.3,
        metalness: 0.6,
        map: windowTex || undefined,
        emissive: new THREE.Color(coin.color),
        emissiveIntensity: isSelected ? 0.8 : (isFilteredOut ? 0.05 : 0.25),
        transparent: true,
        opacity: isFilteredOut ? 0.2 : 1.0
      });

      const bMesh = new THREE.Mesh(baseBoxGeo, mat);
      bMesh.scale.set(baseWidth, coin.height, baseDepth);
      bMesh.userData = { coin };
      bGroup.add(bMesh);

      // Rooftop Glowing Neon Beacon Light
      const beaconGeo = new THREE.CylinderGeometry(baseWidth * 0.2, baseWidth * 0.4, 3, 16);
      const beaconMat = new THREE.MeshBasicMaterial({
        color: coin.color,
        wireframe: false
      });
      const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
      beaconMesh.position.set(0, coin.height / 2 + 1.5, 0);
      bGroup.add(beaconMesh);

      // 3D Billboard Sprite Label above roof
      let labelSprite: THREE.Sprite | null = null;
      const bbTex = createBillboardTexture(coin.symbol, coin.market_cap_rank, coin.price_change_percentage_24h, coin.name);
      if (bbTex) {
        const spriteMat = new THREE.SpriteMaterial({
          map: bbTex,
          transparent: true,
          opacity: isFilteredOut ? 0.2 : 1.0,
          depthWrite: false
        });
        labelSprite = new THREE.Sprite(spriteMat);
        labelSprite.position.set(0, coin.height / 2 + 8, 0);
        labelSprite.scale.set(16, 8, 1);
        bGroup.add(labelSprite);
      }

      scene.add(bGroup);

      const bObj: BuildingObject = {
        group: bGroup,
        mesh: bMesh,
        beaconMesh,
        sprite: labelSprite,
        coin,
        position: new THREE.Vector3(posX, coin.height / 2, posZ),
        height: coin.height
      };

      buildingObjects.push(bObj);
      coinIdToBuilding.set(coin.id, bObj);
    });

    // Focus camera on search-focused coin
    if (focusedCoinId) {
      const targetB = coinIdToBuilding.get(focusedCoinId);
      if (targetB) {
        if (cameraMode === 'flyover' && orbitControls) {
          orbitControls.target.copy(targetB.position);
          camera.position.set(targetB.position.x + 30, targetB.position.y + 40, targetB.position.z + 50);
        } else {
          streetPos.current.set(targetB.position.x, 3.5, targetB.position.z + 25);
          camera.position.copy(streetPos.current);
        }
      }
    }

    // 8. Pointer / Key Event Listeners
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = false;
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (cameraMode === 'street' && e.button === 0) {
        isMouseDown.current = true;
        lastMousePos.current = { x: e.clientX, y: e.clientY };
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (cameraMode === 'street' && isMouseDown.current) {
        const deltaX = e.clientX - lastMousePos.current.x;
        const deltaY = e.clientY - lastMousePos.current.y;

        cameraYaw.current -= deltaX * 0.003;
        cameraPitch.current = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, cameraPitch.current - deltaY * 0.003));

        lastMousePos.current = { x: e.clientX, y: e.clientY };
      }
    };

    const handleMouseUp = () => {
      isMouseDown.current = false;
    };

    // Raycasting for clicking on buildings
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleCanvasClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const meshes = buildingObjects.map(b => b.mesh);
      const intersects = raycaster.intersectObjects(meshes);

      if (intersects.length > 0) {
        const clickedMesh = intersects[0].object as THREE.Mesh;
        const coinData = clickedMesh.userData.coin as CityCoinData;
        if (coinData) {
          onSelectCoin(coinData);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('click', handleCanvasClick);

    // 9. Render & Visibility Optimization Loop (Frustum Culling & Distance LOD)
    let animId: number;
    const projScreenMatrix = new THREE.Matrix4();
    const frustum = new THREE.Frustum();

    const MAX_VISIBILITY_DIST = 380; // Distance beyond which skyscrapers are culled
    const SPRITE_DETAIL_DIST = 160;   // Distance within which high-detail 3D billboard labels show

    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Handle WASD street walk camera physics
      if (cameraMode === 'street') {
        const moveSpeed = keysPressed.current['shift'] ? 1.2 : 0.6;
        const forward = new THREE.Vector3(
          Math.sin(cameraYaw.current),
          0,
          Math.cos(cameraYaw.current)
        ).negate();

        const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).negate();

        if (keysPressed.current['w'] || keysPressed.current['arrowup']) {
          streetPos.current.addScaledVector(forward, moveSpeed);
        }
        if (keysPressed.current['s'] || keysPressed.current['arrowdown']) {
          streetPos.current.addScaledVector(forward, -moveSpeed);
        }
        if (keysPressed.current['a'] || keysPressed.current['arrowleft']) {
          streetPos.current.addScaledVector(right, -moveSpeed);
        }
        if (keysPressed.current['d'] || keysPressed.current['arrowright']) {
          streetPos.current.addScaledVector(right, moveSpeed);
        }

        // Keep street camera at pedestrian eye-level height
        streetPos.current.y = 3.5;
        camera.position.copy(streetPos.current);

        // Update lookAt vector based on yaw and pitch
        const lookTarget = new THREE.Vector3(
          streetPos.current.x + Math.sin(cameraYaw.current) * Math.cos(cameraPitch.current),
          streetPos.current.y + Math.sin(cameraPitch.current),
          streetPos.current.z + Math.cos(cameraYaw.current) * Math.cos(cameraPitch.current)
        );
        camera.lookAt(lookTarget);
      } else if (orbitControls) {
        orbitControls.update();
      }

      // Update Frustum Culling Matrix
      projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
      frustum.setFromProjectionMatrix(projScreenMatrix);

      const camPos = camera.position;

      // Visibility Rendering Optimization: frustum and distance culling
      buildingObjects.forEach(bObj => {
        const dist = camPos.distanceTo(bObj.position);

        // Frustum & Distance Culling
        if (dist > MAX_VISIBILITY_DIST || !frustum.containsPoint(bObj.position)) {
          bObj.group.visible = false; // Culled! Saves GPU & CPU rendering completely
        } else {
          bObj.group.visible = true;

          // Distance LOD for Rooftop Billboard Sprite Labels
          if (bObj.sprite) {
            bObj.sprite.visible = dist < SPRITE_DETAIL_DIST;
          }

          // Subtle rooftop beacon animation
          if (bObj.beaconMesh) {
            bObj.beaconMesh.rotation.y += 0.02;
          }
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    // 10. Resize Observer
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Clean up WebGL resources
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('click', handleCanvasClick);
      resizeObserver.disconnect();

      if (orbitControls) orbitControls.dispose();

      scene.traverse(obj => {
        const m = obj as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
        if (m.material) {
          const mats = Array.isArray(m.material) ? m.material : [m.material];
          mats.forEach(mat => {
            if ('map' in mat && mat.map) (mat.map as THREE.Texture).dispose();
            mat.dispose();
          });
        }
      });

      baseBoxGeo.dispose();
      groundGeo.dispose();
      groundMat.dispose();
      renderer.dispose();
    };
  }, [coins, selectedCoin, cameraMode, districtFilter, focusedCoinId, onSelectCoin]);

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-0">
      <canvas ref={canvasRef} className="w-full h-full block focus:outline-none cursor-grab active:cursor-grabbing" />
    </div>
  );
};
