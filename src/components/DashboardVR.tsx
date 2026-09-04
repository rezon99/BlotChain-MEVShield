import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Filter, ChevronUp, ChevronDown, Glasses } from 'lucide-react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { Node as NodeType, AnimationSettings, DashboardMode } from '../types';
import { useRealTimeData } from '../hooks/useRealTimeData';
import { Header } from './Header';
import { Legend } from './Legend';
import { LiveStatus } from './LiveStatus';
import { SettingsPanel } from './SettingsPanel';
import { ChartModal } from './ChartModal';
import { Tooltip } from './Tooltip';
import { ComparisonPanel } from './ComparisonPanel';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorDisplay } from './ErrorDisplay';

interface DashboardVRProps {
  mode: DashboardMode;
  onModeSwitch: (mode: DashboardMode) => void;
  onViewModeSwitch: (viewMode: '2d' | '3d' | 'vr') => void;
}

export const DashboardVR: React.FC<DashboardVRProps> = ({
  mode,
  onModeSwitch,
  onViewModeSwitch
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [refreshInterval, setRefreshInterval] = useState<number>(() => {
    const saved = localStorage.getItem('blotchain_refresh_interval');
    return saved ? parseInt(saved, 10) : 30000;
  });

  const { nodes, connections, loading, error, lastUpdate, refetch } = useRealTimeData(mode, refreshInterval);
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());
  const [activeChartNode, setActiveChartNode] = useState<NodeType | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [isFilterCollapsed, setIsFilterCollapsed] = useState<boolean>(true);
  const [isControlsCollapsed, setIsControlsCollapsed] = useState<boolean>(true);

  const [animationSettings, setAnimationSettings] = useState<AnimationSettings>(() => {
    const saved = localStorage.getItem('blotchain_animation_settings');
    return saved ? JSON.parse(saved) : {
      enabled: true,
      particleSpeed: 1,
      breathingIntensity: 1
    };
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tooltip, setTooltip] = useState({
    node: {} as NodeType,
    x: 0,
    y: 0,
    visible: false
  });

  // Calculate uniform 3D spherical positions centered around standard human eye height (y = 1.6)
  const nodesVR = useMemo(() => {
    if (nodes.length === 0) return [];

    const hubs = nodes.filter(n => n.isHub);
    const cex = nodes.filter(n => n.category === 'CEX' && !n.isHub);
    const others = nodes.filter(n => !n.isHub && n.category !== 'CEX');

    const result: Array<NodeType & { x3d: number; y3d: number; z3d: number }> = [];
    const centerY = 1.6; // VR standard eye/standing height in meters

    // 1. Core Hubs: place near the center
    hubs.forEach((node, idx) => {
      const angle = (idx / hubs.length) * Math.PI * 2;
      result.push({
        ...node,
        x3d: Math.cos(angle) * 3,
        y3d: centerY + Math.sin(angle) * 1.5,
        z3d: (idx % 2 === 0 ? 1 : -1) * 1
      });
    });

    // 2. CEX nodes: intermediate shell
    cex.forEach((node, idx) => {
      const u = idx / cex.length;
      const theta = u * Math.PI * 2.0;
      const phi = Math.acos(2.0 * u - 1.0) - Math.PI / 2.0;
      const radius = 8;
      result.push({
        ...node,
        x3d: radius * Math.cos(phi) * Math.cos(theta),
        y3d: centerY + radius * Math.sin(phi) * 0.8,
        z3d: radius * Math.cos(phi) * Math.sin(theta)
      });
    });

    // 3. Others: outer shell surrounding the player in 360 degrees
    const count = others.length;
    const phiGold = Math.PI * (3.0 - Math.sqrt(5.0));

    others.forEach((node, idx) => {
      const radius = 14 + (idx % 2) * 1.5;
      const y = 1.0 - (idx / (count - 1)) * 2.0;
      const radiusAtY = Math.sqrt(1.0 - y * y);
      const theta = phiGold * idx;

      result.push({
        ...node,
        x3d: radius * radiusAtY * Math.cos(theta),
        y3d: centerY + radius * y * 0.7,
        z3d: radius * radiusAtY * Math.sin(theta)
      });
    });

    return result;
  }, [nodes]);

  const categories = useMemo(() => {
    const cats = new Set(nodes.filter(n => !n.isHub).map(n => n.category));
    return ['All', ...Array.from(cats)].sort();
  }, [nodes]);

  const filteredNodesVR = useMemo(() => {
    return nodesVR.map(node => {
      const isVisible = categoryFilter === 'All' || node.category === categoryFilter || node.isHub;
      return {
        ...node,
        opacity3d: isVisible ? 1.0 : 0.15
      };
    });
  }, [nodesVR, categoryFilter]);

  const filteredNodesVRMap = useMemo(() => {
    return new Map(filteredNodesVR.map(n => [n.id, n]));
  }, [filteredNodesVR]);

  const selectedNodeData = useMemo(() => {
    return nodes.filter(n => selectedNodes.has(n.id));
  }, [nodes, selectedNodes]);

  const clearSelection = useCallback(() => {
    setSelectedNodes(new Set());
  }, []);

  const toggleComparison = useCallback((nodeId: string) => {
    setSelectedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        if (newSet.size >= 2) {
          const arr = Array.from(newSet);
          return new Set([arr[1], nodeId]);
        }
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);

  const exportToJson = useCallback(() => {
    const data = {
      timestamp: new Date().toISOString(),
      mode,
      viewMode: 'vr',
      nodes,
      connections
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blotchain-vr-export-${mode}-${new Date().getTime()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [mode, nodes, connections]);

  const exportToPng = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const pngUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = pngUrl;
      a.download = `blotchain-vr-snapshot-${mode}-${new Date().getTime()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to export PNG:', err);
    }
  }, [mode]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas || filteredNodesVR.length === 0) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#030712'); // extremely dark space slate-950
    scene.fog = new THREE.FogExp2('#030712', 0.02);

    // Group that contains the entire constellation (enables smooth auto-rotation)
    const constellationGroup = new THREE.Group();
    scene.add(constellationGroup);

    // Camera
    const camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 1000);
    // VR standard starting position (player standing at center of constellation)
    camera.position.set(0, 1.6, 6);

    // Renderer with WebXR enabled
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.xr.enabled = true;

    // Append the VRButton overlay
    const vrButton = VRButton.createButton(renderer);
    vrButton.style.position = 'absolute';
    vrButton.style.bottom = '24px';
    vrButton.style.left = '50%';
    vrButton.style.transform = 'translateX(-50%)';
    vrButton.style.background = 'rgba(79, 70, 229, 0.9)'; // indigo-600
    vrButton.style.border = '1px solid rgba(129, 140, 248, 0.4)';
    vrButton.style.borderRadius = '8px';
    vrButton.style.color = 'white';
    vrButton.style.padding = '8px 16px';
    vrButton.style.fontFamily = 'system-ui, sans-serif';
    vrButton.style.fontSize = '13px';
    vrButton.style.fontWeight = 'bold';
    vrButton.style.zIndex = '30';
    container.appendChild(vrButton);

    // Lights
    const ambientLight = new THREE.AmbientLight('#0f172a', 1.8);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight('#ffffff', 2.5, 60);
    pointLight.position.set(0, 4, 0);
    constellationGroup.add(pointLight);

    const dirLight1 = new THREE.DirectionalLight('#4f46e5', 1.2); // indigo
    dirLight1.position.set(20, 10, 10);
    constellationGroup.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight('#a855f7', 1.2); // purple
    dirLight2.position.set(-20, -10, -10);
    constellationGroup.add(dirLight2);

    // Flat screen drag-to-look fallback (OrbitControls)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 1.6, 0); // focus camera target on eye-height center
    controls.maxDistance = 45;
    controls.minDistance = 1.5;

    // Shared sphere geometry
    const sphereGeo = new THREE.SphereGeometry(1, 24, 24);
    const nodeMeshes: THREE.Group[] = [];

    const getNodeRadius = (size: number) => size / 26;

    // Sprite text texture builder
    const createTextTexture = (name: string, category: string, isHub: boolean, opacity: number) => {
      const textCanvas = document.createElement('canvas');
      textCanvas.width = 192;
      textCanvas.height = 96;
      const ctx = textCanvas.getContext('2d');
      if (!ctx) return null;

      ctx.clearRect(0, 0, 192, 96);

      ctx.fillStyle = `rgba(15, 23, 42, ${0.85 * opacity})`;
      ctx.strokeStyle = `rgba(71, 85, 105, ${0.5 * opacity})`;
      ctx.lineWidth = 2;

      const rX = 8;
      const rY = 8;
      const rW = 176;
      const rH = 64;
      const rad = 8;

      ctx.beginPath();
      ctx.moveTo(rX + rad, rY);
      ctx.lineTo(rX + rW - rad, rY);
      ctx.quadraticCurveTo(rX + rW, rY, rX + rW, rY + rad);
      ctx.lineTo(rX + rW, rY + rH - rad);
      ctx.quadraticCurveTo(rX + rW, rY + rH, rX + rW - rad, rY + rH);
      ctx.lineTo(rX + rad, rY + rH);
      ctx.quadraticCurveTo(rX, rY + rH, rX, rY + rH - rad);
      ctx.lineTo(rX, rY + rad);
      ctx.quadraticCurveTo(rX, rY, rX + rad, rY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
      ctx.font = 'bold 18px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(name, 96, 30);

      ctx.fillStyle = `rgba(148, 163, 184, ${0.9 * opacity})`;
      ctx.font = '500 12px system-ui, sans-serif';
      ctx.fillText(isHub ? 'Hub' : category, 96, 52);

      const texture = new THREE.CanvasTexture(textCanvas);
      texture.minFilter = THREE.LinearFilter;
      return texture;
    };

    // Render node spheres and facing sprites inside constellation
    filteredNodesVR.forEach(node => {
      const nodeGroup = new THREE.Group();
      nodeGroup.position.set(node.x3d, node.y3d, node.z3d);
      nodeGroup.userData = { nodeId: node.id, nodeData: node };

      const r = getNodeRadius(node.size);
      const isSelected = selectedNodes.has(node.id);
      const isHighlighted = selectedNodes.size === 0 || selectedNodes.has(node.id);
      const finalOpacity = node.opacity3d * (isHighlighted ? 1.0 : 0.25);

      const sphereMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(node.color),
        roughness: 0.3,
        metalness: 0.1,
        transparent: true,
        opacity: finalOpacity,
        emissive: new THREE.Color(node.color),
        emissiveIntensity: isSelected ? 0.9 : (node.isHub ? 0.35 : 0.15)
      });

      const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
      sphereMesh.scale.setScalar(r);
      nodeGroup.add(sphereMesh);

      // Sprites facing camera
      const textTex = createTextTexture(node.name, node.category, !!node.isHub, finalOpacity);
      if (textTex) {
        const spriteMat = new THREE.SpriteMaterial({
          map: textTex,
          transparent: true,
          opacity: finalOpacity,
          depthWrite: false
        });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.position.set(0, r + 0.9, 0);
        sprite.scale.set(3, 1.5, 1);
        nodeGroup.add(sprite);
      }

      constellationGroup.add(nodeGroup);
      nodeMeshes.push(nodeGroup);
    });

    // Connections
    const lineMaterial = new THREE.LineBasicMaterial({
      color: '#334155',
      transparent: true,
      opacity: 0.3,
      depthWrite: false
    });

    const activeLineMaterial = new THREE.LineBasicMaterial({
      color: '#4f46e5', // indigo
      transparent: true,
      opacity: 0.8,
      depthWrite: false
    });

    interface ConnectionRef {
      line: THREE.Line;
      particle: THREE.Mesh;
      speed: number;
      progress: number;
      start: THREE.Vector3;
      end: THREE.Vector3;
    }

    const connectionRefs: ConnectionRef[] = [];
    const particleGeo = new THREE.SphereGeometry(0.08, 12, 12);

    connections.forEach(conn => {
      const src = filteredNodesVRMap.get(conn.source);
      const tgt = filteredNodesVRMap.get(conn.target);
      if (!src || !tgt) return;

      const p1 = new THREE.Vector3(src.x3d, src.y3d, src.z3d);
      const p2 = new THREE.Vector3(tgt.x3d, tgt.y3d, tgt.z3d);

      const vector = new THREE.Vector3().subVectors(p2, p1);
      const length = vector.length();

      const r1 = getNodeRadius(src.size) * 1.20; // 20% protective offset
      const r2 = getNodeRadius(tgt.size) * 1.20; // 20% protective offset

      if (length <= r1 + r2) return;

      const p1Offset = p1.clone().addScaledVector(vector.clone().normalize(), r1);
      const p2Offset = p2.clone().addScaledVector(vector.clone().normalize(), -r2);

      const lineGeo = new THREE.BufferGeometry().setFromPoints([p1Offset, p2Offset]);
      const isConnHighlighted = selectedNodes.size === 0 || selectedNodes.has(conn.source) || selectedNodes.has(conn.target);
      const line = new THREE.Line(lineGeo, isConnHighlighted ? activeLineMaterial : lineMaterial);
      constellationGroup.add(line);

      const flowColor = conn.direction === 'in' ? '#10b981' : '#f43f5e';
      const particleMat = new THREE.MeshBasicMaterial({
        color: flowColor,
        transparent: true,
        opacity: isConnHighlighted ? 0.9 : 0.2
      });
      const particle = new THREE.Mesh(particleGeo, particleMat);
      particle.position.copy(p1Offset);
      constellationGroup.add(particle);

      connectionRefs.push({
        line,
        particle,
        speed: 0.002 * animationSettings.particleSpeed * (Math.random() * 0.4 + 0.8),
        progress: Math.random(),
        start: p1Offset,
        end: p2Offset
      });
    });

    // Starfield galaxy environment inside VR
    const starsGeo = new THREE.BufferGeometry();
    const starsCount = 600;
    const starPositions = new Float32Array(starsCount * 3);

    for (let i = 0; i < starsCount * 3; i += 3) {
      // Position stars in a giant outer sphere
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const dist = 35 + Math.random() * 15;

      starPositions[i] = dist * Math.sin(phi) * Math.cos(theta);
      starPositions[i + 1] = 1.6 + dist * Math.cos(phi);
      starPositions[i + 2] = dist * Math.sin(phi) * Math.sin(theta);
    }

    starsGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: '#ffffff',
      size: 0.12,
      transparent: true,
      opacity: 0.65
    });
    const starField = new THREE.Points(starsGeo, starMat);
    constellationGroup.add(starField);

    // Mouse Raycasting (Flat screens)
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let hoveredGroup: THREE.Group | null = null;
    const baseScale = new THREE.Vector3(1, 1, 1);

    const getRaycastIntersect = (clientX: number, clientY: number) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const targets = nodeMeshes.map(g => g.children[0]);
      const intersects = raycaster.intersectObjects(targets);

      if (intersects.length > 0) {
        return intersects[0].object.parent as THREE.Group;
      }
      return null;
    };

    const handlePointerMove = (e: PointerEvent) => {
      // Do not process raycasting during active VR headset presentation
      if (renderer.xr.isPresenting) return;

      const intersected = getRaycastIntersect(e.clientX, e.clientY);
      if (intersected) {
        if (hoveredGroup !== intersected) {
          if (hoveredGroup) hoveredGroup.children[0].scale.copy(baseScale);
          hoveredGroup = intersected;
          const mesh = hoveredGroup.children[0];
          baseScale.copy(mesh.scale);
          mesh.scale.multiplyScalar(1.25);

          const nodeData = hoveredGroup.userData.nodeData as NodeType;
          setTooltip({
            node: nodeData,
            x: e.clientX,
            y: e.clientY - 15,
            visible: true
          });
          document.body.style.cursor = 'pointer';
        } else {
          setTooltip(prev => ({ ...prev, x: e.clientX, y: e.clientY - 15 }));
        }
      } else {
        if (hoveredGroup) {
          hoveredGroup.children[0].scale.copy(baseScale);
          hoveredGroup = null;
          setTooltip(prev => ({ ...prev, visible: false }));
          document.body.style.cursor = 'default';
        }
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (renderer.xr.isPresenting) return;

      const clicked = getRaycastIntersect(e.clientX, e.clientY);
      if (clicked) {
        const nodeData = clicked.userData.nodeData as NodeType;
        if (nodeData.isHub) {
          toggleComparison(nodeData.id);
        } else {
          setActiveChartNode(nodeData);
        }
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerdown', handlePointerDown);

    // Grid plane
    const grid = new THREE.GridHelper(60, 30, '#111827', '#030712');
    grid.position.y = -2;
    scene.add(grid);

    // VR/3D Animation Loop using WebXR setAnimationLoop
    const clock = new THREE.Clock();

    const vrLoop = () => {
      // controls update for flat screen view
      controls.update();

      const time = clock.getElapsedTime();

      // Majestic auto-rotation of constellation around player
      const rotationSpeed = 0.035;
      constellationGroup.rotation.y = time * rotationSpeed;

      // Floating animations inside constellation
      nodeMeshes.forEach(group => {
        const node = group.userData.nodeData as NodeType;
        const mesh = group.children[0] as THREE.Mesh;
        const mat = mesh.material as THREE.MeshStandardMaterial;

        // float offset Y
        const offset = Math.sin(time * 0.7 + node.size) * 0.03;
        group.position.y = node.y3d + offset;

        if (animationSettings.enabled) {
          const breathe = Math.sin(time * 1.4 + node.size) * 0.5 + 0.5;
          mat.emissiveIntensity = (selectedNodes.has(node.id) ? 0.9 : (node.isHub ? 0.35 : 0.15)) +
            breathe * 0.1 * animationSettings.breathingIntensity;
        }
      });

      // Flow guides animation
      if (animationSettings.enabled) {
        connectionRefs.forEach(ref => {
          ref.progress += ref.speed;
          if (ref.progress > 1) ref.progress = 0;
          ref.particle.position.lerpVectors(ref.start, ref.end, ref.progress);
        });
      }

      renderer.render(scene, camera);
    };

    renderer.setAnimationLoop(vrLoop);

    // Handle resized window
    const handleResize = () => {
      if (!container || !canvas) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Clean up
    return () => {
      renderer.setAnimationLoop(null);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      resizeObserver.disconnect();
      controls.dispose();

      // Dispose all geometries, materials, and textures in scene to prevent WebGL leaks
      scene.traverse(object => {
        const mesh = object as THREE.Mesh;
        if (mesh.geometry) {
          mesh.geometry.dispose();
        }
        if (mesh.material) {
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          materials.forEach(mat => {
            if ('map' in mat && mat.map) {
              (mat.map as THREE.Texture).dispose();
            }
            mat.dispose();
          });
        }
      });

      sphereGeo.dispose();
      particleGeo.dispose();
      starsGeo.dispose();
      starMat.dispose();
      lineMaterial.dispose();
      activeLineMaterial.dispose();

      renderer.dispose();
      scene.clear();
      document.body.style.cursor = 'default';

      // Clean up VR Button elements safely
      if (vrButton && vrButton.parentNode) {
        vrButton.parentNode.removeChild(vrButton);
      }
    };
  }, [filteredNodesVR, filteredNodesVRMap, connections, selectedNodes, animationSettings, toggleComparison]);

  if (loading && nodes.length === 0) {
    return <LoadingSpinner />;
  }

  if (error && nodes.length === 0) {
    return <ErrorDisplay error={error} onRetry={refetch} />;
  }

  return (
    <div className="h-screen h-[100dvh] bg-slate-950 overflow-hidden flex flex-col relative">
      <Header
        lastUpdate={lastUpdate}
        mode={mode}
        onModeSwitch={onModeSwitch}
        onOpenSettings={() => setIsSettingsOpen(true)}
        selectedCount={selectedNodes.size}
        onClearSelection={clearSelection}
        viewMode="vr"
        onViewModeSwitch={onViewModeSwitch}
      />

      <div
        ref={containerRef}
        className="relative flex-1 min-h-0 w-full"
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full block focus:outline-none"
        />

        {loading && nodes.length > 0 && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-blue-600/90 text-white px-4 py-1 rounded-full text-xs font-bold animate-pulse z-20">
            UPDATING LIVE DATA...
          </div>
        )}

        {/* VR Instructions Overlay */}
        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10 select-none">
          {isControlsCollapsed ? (
            <button
              onClick={() => setIsControlsCollapsed(false)}
              className="flex items-center gap-1.5 bg-gray-900/85 hover:bg-gray-800/90 text-gray-300 hover:text-white backdrop-blur-md px-2.5 py-1 rounded-full border border-gray-700/80 text-xs font-semibold shadow-md transition-all cursor-pointer"
              title="Show VR controls"
            >
              <Glasses size={13} className="text-purple-400" />
              <span>VR Info</span>
              <ChevronDown size={12} className="text-gray-400" />
            </button>
          ) : (
            <div className="bg-gray-900/95 backdrop-blur-md border border-gray-700 rounded-lg p-2.5 max-w-[220px] shadow-xl">
              <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-gray-800">
                <div className="flex items-center gap-1.5">
                  <Glasses size={13} className="text-purple-400" />
                  <span className="text-white text-[11px] font-bold">VR SPACE MODE</span>
                </div>
                <button
                  onClick={() => setIsControlsCollapsed(true)}
                  className="p-0.5 hover:text-white rounded hover:bg-slate-800 text-gray-400 transition-colors cursor-pointer"
                  title="Collapse controls"
                >
                  <ChevronUp size={13} />
                </button>
              </div>
              <div className="space-y-1 text-gray-300 text-[10px] font-medium">
                <p className="text-indigo-400 font-bold">• Enter VR button at bottom center</p>
                <p>• Headset wraps constellation around your coordinates</p>
                <p>• Supports flat drag-to-look fallback</p>
              </div>
            </div>
          )}
        </div>

        {/* Floating Controls Overlays */}
        <LiveStatus
          nodeCount={nodes.length}
          connectionCount={connections.length}
          mode={mode}
          className="absolute top-4 right-4 z-10"
        />

        <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 z-10 flex flex-col gap-2 max-w-[calc(100%-24px)] pointer-events-none">
          <div className="pointer-events-auto w-fit">
            <Legend
              mode={mode}
              className="bg-gray-900/90 backdrop-blur-md border border-gray-700/80 rounded-lg p-2.5 shadow-lg"
            />
          </div>

          <div className="pointer-events-auto w-fit max-w-full">
            {isFilterCollapsed ? (
              <button
                onClick={() => setIsFilterCollapsed(false)}
                className="flex items-center gap-1.5 bg-gray-900/90 hover:bg-gray-800/90 text-gray-300 hover:text-white backdrop-blur-md px-3 py-1.5 rounded-lg border border-gray-700/80 text-xs font-medium transition-all shadow-md cursor-pointer select-none"
                title="Filter by category"
              >
                <Filter size={13} className="text-blue-400" />
                <span>Filter: <span className="text-white font-semibold">{categoryFilter}</span></span>
                <ChevronUp size={13} className="text-gray-400 ml-0.5" />
              </button>
            ) : (
              <div className="flex flex-col gap-1.5 bg-gray-900/95 backdrop-blur-md p-2 rounded-lg border border-gray-700 shadow-xl max-w-full">
                <div className="flex items-center justify-between gap-3 pb-1 border-b border-gray-800 text-[11px] text-gray-400">
                  <div className="flex items-center gap-1.5">
                    <Filter size={12} className="text-blue-400" />
                    <span className="font-semibold text-gray-300">Category Filter</span>
                  </div>
                  <button
                    onClick={() => setIsFilterCollapsed(true)}
                    className="p-0.5 hover:text-white rounded hover:bg-slate-800 text-gray-400 transition-colors cursor-pointer"
                    title="Collapse filter"
                  >
                    <ChevronDown size={14} />
                  </button>
                </div>
                <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto max-w-full py-0.5">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-2.5 py-1 text-[10px] sm:text-xs rounded-md transition-all whitespace-nowrap font-medium ${
                        categoryFilter === cat
                          ? mode === 'crypto' ? 'bg-blue-600 text-white shadow-md' : 'bg-purple-600 text-white shadow-md'
                          : 'text-gray-400 hover:text-gray-200 hover:bg-slate-800'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Tooltip data={tooltip} />

      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        refreshInterval={refreshInterval}
        setRefreshInterval={setRefreshInterval}
        animationSettings={animationSettings}
        setAnimationSettings={setAnimationSettings}
        onExportJson={exportToJson}
        onExportPng={exportToPng}
      />

      <ComparisonPanel
        selectedNodes={selectedNodeData}
        onClear={clearSelection}
      />

      <ChartModal
        node={activeChartNode}
        onClose={() => setActiveChartNode(null)}
        onAddToComparison={toggleComparison}
      />
    </div>
  );
};
